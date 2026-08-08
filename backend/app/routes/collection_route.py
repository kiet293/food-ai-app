from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List
from app.models.database import get_db
from app.models.user_model import UserDB
from app.models.collection_model import CollectionDB
from app.utils.deps import get_current_user
from app.schemas.collection import CollectionCreate, CollectionResponse, CollectionDetailResponse, RecipeInCollectionsResponse
from app.crud import collection as crud_collection

router = APIRouter(tags=["Collection Management"])

@router.post("", response_model=CollectionResponse, status_code=status.HTTP_201_CREATED)
@router.post("/", response_model=CollectionResponse, status_code=status.HTTP_201_CREATED, include_in_schema=False)
def create_new_collection(
    collection_in: CollectionCreate,
    db: Session = Depends(get_db),
    current_user: UserDB = Depends(get_current_user)
):
    # Tạo bộ sưu tập mới cho người dùng hiện tại
    # Kiểm tra tính hợp lệ của dữ liệu đầu vào (không để trống hoặc toàn khoảng trắng)
    if not collection_in.name or not collection_in.name.strip():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Tên bộ sưu tập không được để trống hoặc chỉ chứa khoảng trắng"
        )
        
    # Kiểm tra trùng lặp tên bộ sưu tập của người dùng này
    existing_col = db.query(CollectionDB).filter(
        CollectionDB.user_id == current_user.id,
        func.lower(CollectionDB.name) == collection_in.name.strip().lower()
    ).first()
    if existing_col:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Bộ sưu tập với tên này đã tồn tại"
        )

    try:
        return crud_collection.create_collection(db=db, user_id=current_user.id, collection_in=collection_in)
    except Exception as e:
        print(f"❌ Lỗi khi tạo bộ sưu tập: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Không thể tạo bộ sưu tập"
        )

@router.get("", response_model=List[CollectionResponse])
@router.get("/", response_model=List[CollectionResponse], include_in_schema=False)
def list_user_collections(
    db: Session = Depends(get_db),
    current_user: UserDB = Depends(get_current_user)
):
    # Lấy danh sách các bộ sưu tập của người dùng hiện tại
    try:
        return crud_collection.get_user_collections(db=db, user_id=current_user.id)
    except Exception as e:
        print(f"❌ Lỗi khi lấy danh sách bộ sưu tập: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Không thể tải danh sách bộ sưu tập"
        )

@router.get("/recipes/all")
def get_all_saved_recipes_in_collections(
    db: Session = Depends(get_db),
    current_user: UserDB = Depends(get_current_user)
):
    try:
        recipes = crud_collection.get_all_recipes_in_collections(db=db, user_id=current_user.id)
        return recipes
    except Exception as e:
        print(f"❌ Lỗi khi lấy danh sách món ăn: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Không thể tải danh sách món ăn"
        )


@router.get("/by-recipe/{recipe_id}", response_model=RecipeInCollectionsResponse)
def get_collections_containing_recipe(
    recipe_id: int,
    db: Session = Depends(get_db),
    current_user: UserDB = Depends(get_current_user)
):
    # Trả về danh sách ID của các bộ sưu tập đang chứa công thức này
    col_ids = crud_collection.get_collection_ids_for_recipe(db=db, user_id=current_user.id, recipe_id=recipe_id)
    if col_ids is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Không tìm thấy công thức món ăn này"
        )
    return {"recipe_id": recipe_id, "collection_ids": col_ids}

@router.get("/{collection_id}", response_model=CollectionDetailResponse)
def get_collection_detail(
    collection_id: int,
    db: Session = Depends(get_db),
    current_user: UserDB = Depends(get_current_user)
):
    # Lấy chi tiết bộ sưu tập kèm danh sách các món ăn bên trong
    col_detail = crud_collection.get_collection_detail(db=db, collection_id=collection_id, user_id=current_user.id)
    if not col_detail:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Không tìm thấy bộ sưu tập"
        )
    return col_detail

@router.delete("/{collection_id}", status_code=status.HTTP_200_OK)
def delete_user_collection(
    collection_id: int,
    db: Session = Depends(get_db),
    current_user: UserDB = Depends(get_current_user)
):
    # Xóa bộ sưu tập
    success = crud_collection.delete_collection(db=db, collection_id=collection_id, user_id=current_user.id)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Không tìm thấy bộ sưu tập để xóa"
        )
    return {"message": "Đã xóa bộ sưu tập thành công"}

@router.post("/{collection_id}/recipes/{recipe_id}", status_code=status.HTTP_200_OK)
def add_recipe_to_user_collection(
    collection_id: int,
    recipe_id: int,
    db: Session = Depends(get_db),
    current_user: UserDB = Depends(get_current_user)
):
    # Thêm công thức vào bộ sưu tập
    assoc = crud_collection.add_recipe_to_collection(
        db=db,
        collection_id=collection_id,
        recipe_id=recipe_id,
        user_id=current_user.id
    )
    if not assoc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Không thể thêm công thức vào bộ sưu tập (bộ sưu tập hoặc món ăn không hợp lệ)"
        )
    return {"message": "Đã thêm món ăn vào bộ sưu tập"}

@router.delete("/{collection_id}/recipes/{recipe_id}", status_code=status.HTTP_200_OK)
def remove_recipe_from_user_collection(
    collection_id: int,
    recipe_id: int,
    db: Session = Depends(get_db),
    current_user: UserDB = Depends(get_current_user)
):
    # Xóa công thức khỏi bộ sưu tập
    success = crud_collection.remove_recipe_from_collection(
        db=db,
        collection_id=collection_id,
        recipe_id=recipe_id,
        user_id=current_user.id
    )
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Món ăn không có trong bộ sưu tập này"
        )
    return {"message": "Đã xóa món ăn khỏi bộ sưu tập"}
