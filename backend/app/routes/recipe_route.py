from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form, Query
import json
import os
import shutil
import uuid
import cloudinary
import cloudinary.uploader
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.models.database import get_db
from app.models.recipe_model import RecipeDB, RecipeStatsDB, RatingDB, CommentDB, CategoryDB, RecipeCategoryDB, TagDB, RecipeTagDB
from app.schemas.recipe import AIAnalysisResult, RateRecipeRequest # Tái sử dụng schema cũ để làm hợp đồng nhận dữ liệu
from app.models.user_model import UserDB
from app.utils.deps import get_current_user
from app.crud.recipe_stats import record_recipe_save
from app.utils.response import success_response, CustomException
import unicodedata
import re

# Khai báo tags chung cho toàn bộ API trong file này
router = APIRouter(tags=["Recipes - Sổ tay & Xu hướng"])

# ====================================================================================================
# HÀM HỖ TRỢ (HELPER FUNCTIONS)
# ====================================================================================================

def slugify(text: str) -> str:
    """Tạo slug từ chuỗi (loại bỏ dấu tiếng Việt, chuyển sang lowercase)"""
    text = unicodedata.normalize('NFKD', text).encode('ASCII', 'ignore').decode('utf-8')
    text = re.sub(r'[^\w\s-]', '', text).strip().lower()
    return re.sub(r'[-\s]+', '-', text)

def upload_image_to_cloudinary(image: UploadFile) -> str:
    """Tải ảnh lên Cloudinary và trả về secure_url."""
    try:
        upload_result = cloudinary.uploader.upload(image.file)
        image_url = upload_result.get("secure_url")
        print(f"📸 Đã lưu ảnh lên Cloudinary thành công: {image_url}")
        return image_url
    except Exception as e:
        print(f"❌ Lỗi khi upload ảnh lên Cloudinary: {e}")
        raise CustomException(
            message=f"Không thể upload ảnh: {str(e)}",
            code="IMAGE_UPLOAD_ERROR",
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

def delete_image_from_cloudinary(image_url: str):
    """Xóa ảnh cũ trên Cloudinary dựa vào URL."""
    if not image_url or "cloudinary.com" not in image_url:
        return
    try:
        parts = image_url.split('/upload/')
        if len(parts) > 1:
            path_part = parts[1]
            if path_part.startswith('v'):
                path_part = path_part.split('/', 1)[1] if '/' in path_part else path_part
            public_id = path_part.rsplit('.', 1)[0]
            print(f"🗑️ Đang xóa ảnh cũ trên Cloudinary: {public_id}")
            cloudinary.uploader.destroy(public_id)
    except Exception as e:
        print(f"❌ Lỗi khi xóa ảnh cũ trên Cloudinary: {e}")
        # Không throw lỗi để tiến trình cập nhật vẫn tiếp tục dù xóa ảnh cũ thất bại

def format_recipe_summary(recipe: RecipeDB):
    author_info = None
    if recipe.author:
        author_info = {
            "id": recipe.author.id,
            "name": recipe.author.full_name or recipe.author.username,
            "handle": f"@{recipe.author.username}",
            "avatar": recipe.author.avatar
        }
    
    ratings_list = [r.score for r in recipe.ratings] if recipe.ratings else []
    ratings_avg = sum(ratings_list) / len(ratings_list) if ratings_list else 0
    
    return {
        "id": recipe.id,
        "title": recipe.recipe_name,
        "image": recipe.image_url,
        "cook_time_minutes": recipe.cook_time_minutes,
        "difficulty": recipe.difficulty,
        "author": author_info,
        "ratings_avg": round(ratings_avg, 1),
        "ratings_count": len(ratings_list),
        "comments_count": len(recipe.comments) if recipe.comments else 0,
        "save_count": 0, # Tạm thời trả về 0 theo kế hoạch
        "cooked_count": 0, # Tạm thời trả về 0 theo kế hoạch
        "created_at": recipe.created_at.isoformat() if recipe.created_at else None
    }

# API LẤY DANH SÁCH TRENDING RECIPES
@router.get("/trending")
def get_trending_recipes(limit: int = 10, db: Session = Depends(get_db)):
    """Lấy danh sách các món ăn đang hot dựa trên trending_score"""
    try:
        recipes = db.query(RecipeDB).order_by(RecipeDB.trending_score.desc().nullslast()).limit(limit).all()
        
        results = []
        for index, recipe in enumerate(recipes):
            summary = format_recipe_summary(recipe)
            # Gắn badge cho top 3 món cao điểm nhất
            if index < 3:
                summary["badge"] = "Đang Hot 🚀"
            results.append(summary)
            
        return success_response(data=results, message="Lấy danh sách Trending thành công")
    except Exception as e:
        print(f"❌ Lỗi khi lấy Trending Recipes: {e}")
        raise CustomException(
            message=f"Lỗi hệ thống khi lấy danh sách Trending",
            code="FETCH_TRENDING_ERROR",
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

# API LƯU CÔNG THỨC VÀO SỔ TAY
@router.post("/save")
def save_recipe(recipe_data: AIAnalysisResult, db: Session = Depends(get_db), current_user: UserDB = Depends(get_current_user)):
    # Kiểm tra xem món ăn đã tồn tại chưa
    existing_recipe = db.query(RecipeDB).filter(
        RecipeDB.user_id == current_user.id,
        RecipeDB.recipe_name == recipe_data.recipeName
    ).first()
    
    # Nếu tìm thấy món ăn với tên y hệt
    if existing_recipe:
        # Chặn ngay từ cửa, ném thẳng lỗi 400 về cho điện thoại
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, 
            detail="Công thức này đã tồn tại trong Sổ tay của bạn!"
        )
    
    # Nếu chưa có, tiến hành lưu
    try:
        # Chuyển đổi dữ liệu JSON từ App gửi lên thành Object của Database
        ingredients_list = [{"name": i.name, "probability": i.probability} for i in recipe_data.ingredients]

        new_recipe = RecipeDB(
            user_id=current_user.id,
            recipe_name=recipe_data.recipeName,
            ingredients=ingredients_list,
            instructions=recipe_data.instructions,
            image_url=recipe_data.imageUrl
        )

        # Lưu vào Database
        db.add(new_recipe)
        db.commit()
        db.refresh(new_recipe) # Lấy ID vừa được tạo ra

        # Ghi nhận lượt lưu (Thích) vào bảng thống kê phổ biến
        record_recipe_save(
            db=db, 
            recipe_name=recipe_data.recipeName, 
            ingredients=ingredients_list, 
            instructions=recipe_data.instructions, 
            image_url=recipe_data.imageUrl
        )

        print(f"💾 Đã lưu thành công món: {new_recipe.recipe_name}")
        return {"message": "Lưu công thức thành công!", "recipe_id": new_recipe.id}

    except Exception as e:
        db.rollback() # Nếu lỗi thì hoàn tác, không làm hỏng Database
        print(f"❌ Lỗi khi lưu DB: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, 
            detail="Không thể lưu vào CSDL"
        )

# api lấy danh sách công thức nấu ăn từ database
@router.get("/list")
def get_all_recipes(db: Session = Depends(get_db), current_user: UserDB = Depends(get_current_user)):
    try:
        # Lấy tất cả các món, sắp xếp mới nhất xuống dưới cùng (tăng dần)
        recipes = db.query(RecipeDB).filter(RecipeDB.user_id == current_user.id).order_by(RecipeDB.id.desc()).all()
        
        print(f"📖 Đã xuất kho {len(recipes)} công thức cho Sổ tay!")
        # Trả về đúng định dạng mảng (Array) mà App đã khai báo (data.map)
        return recipes
    except Exception as e:
        print(f"❌ Lỗi khi lấy danh sách Sổ tay: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, 
            detail="Không thể tải danh sách công thức"
        )

# api xóa công thức nấu ăn khỏi database
@router.delete("/{recipe_id}")
def delete_recipe(recipe_id: int, db: Session = Depends(get_db), current_user: UserDB = Depends(get_current_user)):
    try:
        # tìm công thức trong DB
        recipe = db.query(RecipeDB).filter(RecipeDB.id == recipe_id, RecipeDB.user_id == current_user.id).first()
        # nếu không tìm thấy công thức
        if not recipe:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, 
                detail="Không tìm thấy công thức"
            )
        # xóa công thức
        db.delete(recipe)
        # commit để lưu thay đổi
        db.commit()
        
        print(f"🗑️ Đã xóa công thức: {recipe.recipe_name}")
        return {"message": "Đã xóa công thức thành công"}
    except Exception as e:
        db.rollback()
        print(f"❌ Lỗi khi xóa công thức: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, 
            detail="Không thể xóa công thức"
        )

# api lấy danh sách 10 món ăn phổ biến nhất hệ thống
@router.get("/popular")
def get_popular_recipes(db: Session = Depends(get_db)):
    try:
        # Lấy 10 món ăn có lượt lưu cao nhất, ưu tiên scan_count nếu trùng save_count
        popular_recipes = db.query(RecipeStatsDB).order_by(
            RecipeStatsDB.save_count.desc(),
            RecipeStatsDB.scan_count.desc()
        ).limit(10).all()
        
        print(f"🔥 Đã xuất kho {len(popular_recipes)} món ăn phổ biến cho Xu hướng!")
        return popular_recipes
    except Exception as e:
        print(f"❌ Lỗi khi lấy danh sách xu hướng: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, 
            detail="Không thể tải danh sách món ăn xu hướng"
        )

# API ĐĂNG TẢI CÔNG THỨC MỚI (US-06)
@router.post("/")
def create_recipe(
    recipe_name: str = Form(...),
    description: str = Form(None),
    ingredients: str = Form(...), # Sẽ nhận mảng dạng chuỗi JSON
    instructions: str = Form(...), # Sẽ nhận mảng dạng chuỗi JSON
    cook_time_minutes: int = Form(None),
    servings: int = Form(None),
    difficulty: str = Form(None),
    category_name: str = Form(None),
    tags: str = Form(None), # Danh sách tag dưới dạng JSON string
    image: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: UserDB = Depends(get_current_user)
):
    try:
        # Parse JSON từ form data
        try:
            parsed_ingredients = json.loads(ingredients)
            parsed_instructions = json.loads(instructions)
        except json.JSONDecodeError as e:
            print(f"❌ Lỗi khi parse JSON: {e}")
            raise CustomException(
                message="Dữ liệu ingredients hoặc instructions không đúng định dạng JSON",
                code="INVALID_JSON_FORMAT",
                status_code=status.HTTP_400_BAD_REQUEST
            )

        # Xử lý upload ảnh với Cloudinary
        image_url = upload_image_to_cloudinary(image) if image else None

        # Tạo mới record
        try:
            new_recipe = RecipeDB(
                user_id=current_user.id,
                recipe_name=recipe_name,
                description=description,
                ingredients=parsed_ingredients,
                instructions=parsed_instructions,
                cook_time_minutes=cook_time_minutes,
                servings=servings,
                difficulty=difficulty,
                image_url=image_url
            )

            db.add(new_recipe)
            db.commit()
            db.refresh(new_recipe)
            
            # Xử lý Category
            if category_name:
                category = db.query(CategoryDB).filter(CategoryDB.name == category_name).first()
                if category:
                    recipe_cat = RecipeCategoryDB(recipe_id=new_recipe.id, category_id=category.id)
                    db.add(recipe_cat)

            # Xử lý Tags
            if tags:
                try:
                    parsed_tags = json.loads(tags)
                    if isinstance(parsed_tags, list):
                        for tag_name in parsed_tags:
                            tag_name = tag_name.strip()
                            if not tag_name: continue
                            
                            tag_slug = slugify(tag_name)
                            # Kiểm tra tag đã tồn tại chưa
                            existing_tag = db.query(TagDB).filter(TagDB.slug == tag_slug).first()
                            
                            if not existing_tag:
                                existing_tag = TagDB(name=tag_name, slug=tag_slug, usage_count=1)
                                db.add(existing_tag)
                                db.commit() # Cần commit để lấy ID
                                db.refresh(existing_tag)
                            else:
                                existing_tag.usage_count += 1
                            
                            # Liên kết Tag với Recipe
                            recipe_tag = RecipeTagDB(recipe_id=new_recipe.id, tag_id=existing_tag.id)
                            db.add(recipe_tag)
                except json.JSONDecodeError as e:
                    print(f"Lỗi parse tags JSON: {e}")

            db.commit()
            
            print(f"✅ Đã tạo công thức mới: {new_recipe.recipe_name}")
            return success_response(data={"recipe_id": new_recipe.id}, message="Đăng tải công thức thành công!")
        except Exception as e:
            db.rollback()
            import traceback
            traceback.print_exc()
            print(f"❌ Lỗi DATABASE khi insert công thức: {e}")
            raise CustomException(
                message=f"Lỗi Database: {str(e)}",
                code="DB_INSERT_ERROR",
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    except CustomException:
        raise
    except Exception as e:
        import traceback
        traceback.print_exc()
        print(f"❌ Lỗi hệ thống: {e}")
        raise CustomException(
            message="Không thể tạo công thức mới",
            code="CREATE_RECIPE_ERROR",
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


# ====================================================================================================
# API QUẢN LÝ DANH MỤC (CATEGORIES)
# ====================================================================================================

@router.get("/categories")
def get_categories(db: Session = Depends(get_db)):
    """
    Lấy danh sách tất cả các danh mục món ăn (Category)
    """
    try:
        categories = db.query(CategoryDB).order_by(CategoryDB.id).all()
        result = [{"id": c.id, "name": c.name, "slug": c.slug} for c in categories]
        return success_response(result)
    except Exception as e:
        raise CustomException(status_code=500, message=f"Lỗi khi lấy danh mục: {str(e)}")


# ====================================================================================================
# API EXPLORE GRID (Sử dụng Cursor-based pagination bằng ID)
# ====================================================================================================
@router.get("/explore-grid")
def get_explore_grid(
    cursor: int = Query(None, description="ID của công thức cuối cùng ở lần tải trước"),
    limit: int = Query(18, ge=1, le=50, description="Số lượng ảnh cần lấy"),
    db: Session = Depends(get_db)
):
    try:
        # Sắp xếp mới nhất lên đầu (dựa vào ID giảm dần cho nhanh và chính xác)
        query = db.query(RecipeDB).order_by(RecipeDB.id.desc())
        
        # Nếu có cursor, chỉ lấy các bài viết cũ hơn bài viết có ID = cursor
        if cursor:
            query = query.filter(RecipeDB.id < cursor)
            
        recipes = query.limit(limit).all()
        
        # Xác định next_cursor
        next_cursor = recipes[-1].id if len(recipes) == limit else None
        
        # Format trả về chỉ cần id và image_url để hiển thị Grid cho nhẹ
        result_list = [
            {
                "id": r.id,
                "image": r.image_url or "https://images.unsplash.com/photo-1498837167922-ddd27525d352?w=500"
            }
            for r in recipes
        ]
        
        return success_response(
            data={
                "items": result_list,
                "next_cursor": next_cursor
            }
        )
    except Exception as e:
        print(f"❌ Lỗi khi lấy explore grid: {e}")
        raise CustomException(
            message="Lỗi khi lấy danh sách khám phá",
            code="EXPLORE_GRID_ERROR",
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

# ====================================================================================================
# API EXPLORE FEED (Sử dụng Cursor-based pagination bằng ID, trả về full chi tiết)
# ====================================================================================================
@router.get("/explore-feed")
def get_explore_feed(
    start_id: int = Query(None, description="ID của món ăn được click (Nếu có)"),
    limit: int = Query(5, ge=1, le=20, description="Số lượng bài viết cần lấy"),
    db: Session = Depends(get_db)
):
    try:
        query = db.query(RecipeDB).order_by(RecipeDB.id.desc())
        
        # Lấy từ start_id trở xuống
        if start_id:
            query = query.filter(RecipeDB.id <= start_id)
            
        recipes = query.limit(limit).all()
        
        next_cursor = recipes[-1].id - 1 if len(recipes) == limit else None
        
        result_list = [format_recipe_summary(r) for r in recipes]
        
        return success_response(
            data={
                "items": result_list,
                "next_cursor": next_cursor
            }
        )
    except Exception as e:
        print(f"❌ Lỗi khi lấy explore feed: {e}")
        raise CustomException(
            message="Lỗi khi lấy danh sách feed",
            code="EXPLORE_FEED_ERROR",
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


# API LẤY CHI TIẾT CÔNG THỨC NẤU ĂN
@router.get("/{recipe_id}")
def get_recipe_details(recipe_id: int, db: Session = Depends(get_db)):
    try:
        # Tìm công thức trong DB
        recipe = db.query(RecipeDB).filter(RecipeDB.id == recipe_id).first()
        if not recipe:
            raise CustomException(
                message="Không tìm thấy công thức",
                code="RECIPE_NOT_FOUND",
                status_code=status.HTTP_404_NOT_FOUND
            )
        
        # Sử dụng hàm hỗ trợ để lấy các trường cơ bản
        recipe_data = format_recipe_summary(recipe)
        
        # Bổ sung thêm các trường chi tiết (description, ingredients, instructions, servings)
        recipe_data["description"] = recipe.description
        recipe_data["ingredients"] = recipe.ingredients
        recipe_data["instructions"] = recipe.instructions
        recipe_data["servings"] = recipe.servings
        
        # Bổ sung nội dung chi tiết bình luận dạng cây (comments array)
        comments_dict = {}
        root_comments = []
        if recipe.comments:
            sorted_comments = sorted(recipe.comments, key=lambda x: x.id)
            for c in sorted_comments:
                user_info = None
                if c.user:
                    user_info = {
                        "id": c.user.id,
                        "name": c.user.full_name or c.user.username,
                        "avatar": c.user.avatar
                    }
                comment_obj = {
                    "id": c.id,
                    "content": c.content,
                    "created_at": c.created_at.isoformat() if c.created_at else None,
                    "user": user_info,
                    "is_author": c.user_id == recipe.user_id,
                    "replies": []
                }
                comments_dict[c.id] = comment_obj
                
            for c in sorted_comments:
                if getattr(c, "parent_comment_id", None) and getattr(c, "parent_comment_id") in comments_dict:
                    comments_dict[c.parent_comment_id]["replies"].append(comments_dict[c.id])
                else:
                    root_comments.append(comments_dict[c.id])
                    
        recipe_data["comments"] = root_comments
        
        return success_response(data=recipe_data, message="Lấy thông tin chi tiết công thức thành công")
        
    except CustomException:
        raise
    except Exception as e:
        import traceback
        traceback.print_exc()
        print(f"❌ Lỗi khi lấy chi tiết công thức: {e}")
        raise CustomException(
            message="Lỗi hệ thống khi tải chi tiết công thức",
            code="GET_RECIPE_ERROR",
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


# API LẤY DANH SÁCH CÔNG THỨC (PHÂN TRANG & LỌC)
@router.get("/")
def get_recipes(
    page: int = Query(1, ge=1),
    limit: int = Query(10, ge=1, le=50),
    sort_by: str = Query("newest", description="Sắp xếp theo: newest, popular, top_rated"),
    db: Session = Depends(get_db)
):
    try:
        if sort_by not in ["newest", "popular", "top_rated"]:
            sort_by = "newest"

        query = db.query(RecipeDB)

        # Xử lý sort
        if sort_by == "newest":
            query = query.order_by(RecipeDB.created_at.desc())
        
        elif sort_by == "top_rated":
            # Subquery để tính điểm trung bình
            avg_rating_subq = db.query(
                RatingDB.recipe_id,
                func.avg(RatingDB.score).label("avg_score")
            ).group_by(RatingDB.recipe_id).subquery()
            
            query = query.outerjoin(avg_rating_subq, RecipeDB.id == avg_rating_subq.c.recipe_id)
            query = query.order_by(avg_rating_subq.c.avg_score.desc().nulls_last(), RecipeDB.created_at.desc())
        
        elif sort_by == "popular":
            # Subquery đếm số lượng đánh giá
            rating_count_subq = db.query(
                RatingDB.recipe_id,
                func.count(RatingDB.id).label("r_count")
            ).group_by(RatingDB.recipe_id).subquery()
            
            # Subquery đếm số lượng bình luận
            comment_count_subq = db.query(
                CommentDB.recipe_id,
                func.count(CommentDB.id).label("c_count")
            ).group_by(CommentDB.recipe_id).subquery()
            
            query = query.outerjoin(rating_count_subq, RecipeDB.id == rating_count_subq.c.recipe_id)
            query = query.outerjoin(comment_count_subq, RecipeDB.id == comment_count_subq.c.recipe_id)
            
            # Sắp xếp theo tổng số lượng tương tác (ratings + comments)
            query = query.order_by(
                (func.coalesce(rating_count_subq.c.r_count, 0) + func.coalesce(comment_count_subq.c.c_count, 0)).desc(),
                RecipeDB.created_at.desc()
            )

        # Tính tổng số lượng để phân trang
        total_items = query.count()
        total_pages = (total_items + limit - 1) // limit

        # Phân trang
        recipes = query.offset((page - 1) * limit).limit(limit).all()

        # Format kết quả bằng hàm hỗ trợ
        result_list = [format_recipe_summary(recipe) for recipe in recipes]

        return success_response(
            data={
                "items": result_list,
                "pagination": {
                    "current_page": page,
                    "total_pages": total_pages,
                    "total_items": total_items,
                    "limit": limit
                }
            }, 
            message="Lấy danh sách công thức thành công"
        )
        
    except Exception as e:
        import traceback
        traceback.print_exc()
        print(f"❌ Lỗi khi lấy danh sách công thức: {e}")
        raise CustomException(
            message="Lỗi hệ thống khi tải danh sách công thức",
            code="GET_RECIPES_ERROR",
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


# API CHỈNH SỬA CÔNG THỨC NẤU ĂN
@router.put("/{recipe_id}")
def update_recipe(
    recipe_id: int,
    recipe_name: str = Form(None),
    description: str = Form(None),
    ingredients: str = Form(None), 
    instructions: str = Form(None), 
    cook_time_minutes: int = Form(None),
    servings: int = Form(None),
    difficulty: str = Form(None),
    image: UploadFile = File(None),
    db: Session = Depends(get_db),
    current_user: UserDB = Depends(get_current_user)
):
    try:
        # Tìm công thức trong DB
        recipe = db.query(RecipeDB).filter(RecipeDB.id == recipe_id).first()
        if not recipe:
            raise CustomException(
                message="Không tìm thấy công thức",
                code="RECIPE_NOT_FOUND",
                status_code=status.HTTP_404_NOT_FOUND
            )
            
        # Kiểm tra quyền tác giả
        if recipe.user_id != current_user.id:
            raise CustomException(
                message="Bạn không có quyền chỉnh sửa công thức này",
                code="FORBIDDEN",
                status_code=status.HTTP_403_FORBIDDEN
            )
            
        # Parse JSON nếu có
        if ingredients:
            try:
                parsed_ingredients = json.loads(ingredients)
                recipe.ingredients = parsed_ingredients
            except json.JSONDecodeError as e:
                print(f"❌ Lỗi khi parse JSON ingredients: {e}")
                raise CustomException(
                    message="Dữ liệu ingredients không đúng định dạng JSON",
                    code="INVALID_JSON_FORMAT",
                    status_code=status.HTTP_400_BAD_REQUEST
                )
                
        if instructions:
            try:
                parsed_instructions = json.loads(instructions)
                recipe.instructions = parsed_instructions
            except json.JSONDecodeError as e:
                print(f"❌ Lỗi khi parse JSON instructions: {e}")
                raise CustomException(
                    message="Dữ liệu instructions không đúng định dạng JSON",
                    code="INVALID_JSON_FORMAT",
                    status_code=status.HTTP_400_BAD_REQUEST
                )

        # Xử lý cập nhật ảnh với Cloudinary
        if image:
            # 1. Xóa ảnh cũ
            delete_image_from_cloudinary(recipe.image_url)
            # 2. Upload ảnh mới
            recipe.image_url = upload_image_to_cloudinary(image)

        # Cập nhật các trường dữ liệu text
        if recipe_name is not None:
            recipe.recipe_name = recipe_name
        if description is not None:
            recipe.description = description
        if cook_time_minutes is not None:
            recipe.cook_time_minutes = cook_time_minutes
        if servings is not None:
            recipe.servings = servings
        if difficulty is not None:
            recipe.difficulty = difficulty

        # Lưu thay đổi
        db.commit()
        db.refresh(recipe)
        
        print(f"✅ Đã cập nhật công thức: {recipe.recipe_name}")
        
        # Trả về data (tái sử dụng format_recipe_summary)
        recipe_data = format_recipe_summary(recipe)
        recipe_data["description"] = recipe.description
        recipe_data["ingredients"] = recipe.ingredients
        recipe_data["instructions"] = recipe.instructions
        recipe_data["servings"] = recipe.servings
        
        return success_response(data=recipe_data, message="Cập nhật công thức thành công!")
        
    except CustomException:
        raise
    except Exception as e:
        db.rollback()
        import traceback
        traceback.print_exc()
        print(f"❌ Lỗi hệ thống khi cập nhật công thức: {e}")
        raise CustomException(
            message="Lỗi hệ thống khi cập nhật công thức",
            code="UPDATE_RECIPE_ERROR",
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

@router.post("/{recipe_id}/rate")
def rate_recipe(
    recipe_id: int, 
    request: RateRecipeRequest, 
    db: Session = Depends(get_db), 
    current_user: UserDB = Depends(get_current_user)
):
    try:
        # 1. Kiểm tra công thức có tồn tại không
        recipe = db.query(RecipeDB).filter(RecipeDB.id == recipe_id).first()
        if not recipe:
            raise CustomException(
                message="Không tìm thấy công thức",
                code="RECIPE_NOT_FOUND",
                status_code=404
            )
            
        # 2. Xử lý logic đánh giá
        existing_rating = db.query(RatingDB).filter(
            RatingDB.recipe_id == recipe_id, 
            RatingDB.user_id == current_user.id
        ).first()
        
        if existing_rating:
            existing_rating.score = request.score
        else:
            new_rating = RatingDB(
                recipe_id=recipe_id,
                user_id=current_user.id,
                score=request.score
            )
            db.add(new_rating)
            
        # 3. Xử lý logic comment nếu có nhập chữ
        if request.comment and request.comment.strip():
            new_comment = CommentDB(
                recipe_id=recipe_id,
                user_id=current_user.id,
                content=request.comment.strip()
            )
            db.add(new_comment)
            
        db.commit()
        return success_response(message="Đánh giá công thức thành công!")
    except Exception as e:
        db.rollback()
        raise CustomException(
            message=f"Lỗi khi lưu đánh giá: {e}",
            code="RATE_RECIPE_ERROR",
            status_code=500
        )
