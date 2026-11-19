from sqlalchemy.orm import Session, selectinload, joinedload
from sqlalchemy import func
from typing import List, Optional

from app.modules.collections.model import CollectionDB, CollectionRecipeDB
from app.modules.collections.schema import CollectionCreate, CollectionDetailResponse, CollectionResponse
from app.modules.recipes.model import RecipeDB
from app.modules.users.model import UserDB

class CollectionService:
    @staticmethod
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

    @staticmethod
    def get_user_collections(db: Session, user_id: int) -> List[CollectionResponse]:
        collections = db.query(CollectionDB).options(selectinload(CollectionDB.recipe_associations).joinedload(CollectionRecipeDB.recipe)).filter(CollectionDB.user_id == user_id).order_by(CollectionDB.id.desc()).all()
        
        result = []
        for col in collections:
            count = len(col.recipe_associations)
            
            cover_img = col.cover_image
            if not cover_img and count > 0:
                first_assoc = max(col.recipe_associations, key=lambda a: (a.added_at, a.id), default=None)
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

    @staticmethod
    def get_collection_by_id(db: Session, collection_id: int, user_id: int) -> Optional[CollectionDB]:
        return db.query(CollectionDB).filter(
            CollectionDB.id == collection_id,
            CollectionDB.user_id == user_id
        ).first()

    @staticmethod
    def get_collection_detail(db: Session, collection_id: int, user_id: int) -> Optional[CollectionDetailResponse]:
        col = CollectionService.get_collection_by_id(db, collection_id, user_id)
        if not col:
            return None
            
        assocs = db.query(CollectionRecipeDB).options(joinedload(CollectionRecipeDB.recipe)).filter(
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

    @staticmethod
    def delete_collection(db: Session, collection_id: int, user_id: int) -> bool:
        col = CollectionService.get_collection_by_id(db, collection_id, user_id)
        if not col:
            return False
        db.delete(col)
        db.commit()
        return True

    @staticmethod
    def add_recipe_to_collection(db: Session, collection_id: int, recipe_id: int, user_id: int) -> Optional[CollectionRecipeDB]:
        col = CollectionService.get_collection_by_id(db, collection_id, user_id)
        if not col:
            return None
            
        recipe = db.query(RecipeDB).filter(RecipeDB.id == recipe_id).first()
        if not recipe:
            return None
            
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

    @staticmethod
    def remove_recipe_from_collection(db: Session, collection_id: int, recipe_id: int, user_id: int) -> bool:
        col = CollectionService.get_collection_by_id(db, collection_id, user_id)
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

    @staticmethod
    def get_collection_ids_for_recipe(db: Session, user_id: int, recipe_id: int) -> Optional[List[int]]:
        recipe = db.query(RecipeDB).filter(RecipeDB.id == recipe_id).first()
        if not recipe:
            return None

        cols = db.query(CollectionDB.id).join(
            CollectionRecipeDB, CollectionDB.id == CollectionRecipeDB.collection_id
        ).filter(
            CollectionDB.user_id == user_id,
            CollectionRecipeDB.recipe_id == recipe_id
        ).all()
        return [c[0] for c in cols]

    @staticmethod
    def get_all_recipes_in_collections(db: Session, user_id: int) -> List[RecipeDB]:
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
