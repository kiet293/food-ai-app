from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List, Optional
from app.models import CollectionDB, CollectionRecipeDB, RecipeDB, UserDB
from app.schemas.collection import CollectionCreate, CollectionResponse, CollectionDetailResponse

def create_collection(db: Session, user_id: int, collection_in: CollectionCreate) -> CollectionResponse:
    db_collection = CollectionDB(
        user_id=user_id,
        name=collection_in.name.strip(),
        cover_image=collection_in.cover_image
    )
    db.add(db_collection)
    db.commit()
    db.refresh(db_collection)
    return CollectionResponse(
        id=db_collection.id,
        user_id=db_collection.user_id,
        name=db_collection.name,
        cover_image=db_collection.cover_image,
        recipe_count=0,
        created_at=db_collection.created_at
    )

def get_user_collections(db: Session, user_id: int) -> List[CollectionResponse]:
    collections = db.query(CollectionDB).filter(CollectionDB.user_id == user_id).order_by(CollectionDB.id.desc()).all()
    
    result = []
    for col in collections:
        # Count recipes in this collection
        count = db.query(CollectionRecipeDB).filter(CollectionRecipeDB.collection_id == col.id).count()
        
        # Determine cover image: self cover_image -> first recipe's image -> None
        cover_img = col.cover_image
        if not cover_img and count > 0:
            first_assoc = db.query(CollectionRecipeDB).filter(
                CollectionRecipeDB.collection_id == col.id
            ).order_by(CollectionRecipeDB.added_at.desc()).first()
            if first_assoc and first_assoc.recipe and first_assoc.recipe.image_url:
                cover_img = first_assoc.recipe.image_url
        
        result.append(CollectionResponse(
            id=col.id,
            user_id=col.user_id,
            name=col.name,
            cover_image=cover_img,
            recipe_count=count,
            created_at=col.created_at
        ))
    return result

def get_collection_by_id(db: Session, collection_id: int, user_id: int) -> Optional[CollectionDB]:
    return db.query(CollectionDB).filter(
        CollectionDB.id == collection_id,
        CollectionDB.user_id == user_id
    ).first()

def get_collection_detail(db: Session, collection_id: int, user_id: int) -> Optional[CollectionDetailResponse]:
    col = get_collection_by_id(db, collection_id, user_id)
    if not col:
        return None
        
    assocs = db.query(CollectionRecipeDB).filter(
        CollectionRecipeDB.collection_id == col.id
    ).order_by(CollectionRecipeDB.added_at.desc()).all()
    
    recipes = [assoc.recipe for assoc in assocs if assoc.recipe]
    
    cover_img = col.cover_image
    if not cover_img and len(recipes) > 0 and recipes[0].image_url:
        cover_img = recipes[0].image_url
        
    return CollectionDetailResponse(
        id=col.id,
        user_id=col.user_id,
        name=col.name,
        cover_image=cover_img,
        recipe_count=len(recipes),
        created_at=col.created_at,
        recipes=recipes
    )

def delete_collection(db: Session, collection_id: int, user_id: int) -> bool:
    col = get_collection_by_id(db, collection_id, user_id)
    if not col:
        return False
    db.delete(col)
    db.commit()
    return True

def add_recipe_to_collection(db: Session, collection_id: int, recipe_id: int, user_id: int) -> Optional[CollectionRecipeDB]:
    col = get_collection_by_id(db, collection_id, user_id)
    if not col:
        return None
        
    # Check if recipe exists and belongs to user (or is public/accessible)
    recipe = db.query(RecipeDB).filter(RecipeDB.id == recipe_id).first()
    if not recipe:
        return None
        
    # Check if already added
    existing = db.query(CollectionRecipeDB).filter(
        CollectionRecipeDB.collection_id == collection_id,
        CollectionRecipeDB.recipe_id == recipe_id
    ).first()
    
    if existing:
        return existing
        
    assoc = CollectionRecipeDB(collection_id=collection_id, recipe_id=recipe_id)
    db.add(assoc)
    db.commit()
    db.refresh(assoc)
    return assoc

def remove_recipe_from_collection(db: Session, collection_id: int, recipe_id: int, user_id: int) -> bool:
    col = get_collection_by_id(db, collection_id, user_id)
    if not col:
        return False
        
    assoc = db.query(CollectionRecipeDB).filter(
        CollectionRecipeDB.collection_id == collection_id,
        CollectionRecipeDB.recipe_id == recipe_id
    ).first()
    
    if not assoc:
        return False
        
    db.delete(assoc)
    db.commit()
    return True

def get_collection_ids_for_recipe(db: Session, user_id: int, recipe_id: int) -> Optional[List[int]]:
    # Kiểm tra món ăn có tồn tại trong hệ thống không
    recipe = db.query(RecipeDB).filter(RecipeDB.id == recipe_id).first()
    if not recipe:
        return None

    # Tìm tất cả collection_id của user có chứa recipe_id
    cols = db.query(CollectionDB.id).join(
        CollectionRecipeDB, CollectionDB.id == CollectionRecipeDB.collection_id
    ).filter(
        CollectionDB.user_id == user_id,
        CollectionRecipeDB.recipe_id == recipe_id
    ).all()
    return [c[0] for c in cols]


def get_all_recipes_in_collections(db: Session, user_id: int) -> List[RecipeDB]:
    # Tìm tất cả món ăn nằm trong bất kỳ collection nào của user này
    recipes = db.query(RecipeDB).join(
        CollectionRecipeDB, RecipeDB.id == CollectionRecipeDB.recipe_id
    ).join(
        CollectionDB, CollectionRecipeDB.collection_id == CollectionDB.id
    ).filter(
        CollectionDB.user_id == user_id
    ).order_by(RecipeDB.id.desc()).all()
    
    seen = set()
    result = []
    for r in recipes:
        if r.id not in seen:
            seen.add(r.id)
            result.append(r)
            
    return result
