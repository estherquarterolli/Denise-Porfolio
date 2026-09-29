"""
Funções de acesso ao banco (CRUD) para projetos e imagens.
"""
import re
import unicodedata
from typing import List, Optional

from sqlalchemy import or_
from sqlalchemy.orm import Session

from app import models, schemas


def slugify(text: str) -> str:
    text = unicodedata.normalize("NFKD", text).encode("ascii", "ignore").decode("ascii")
    text = re.sub(r"[^\w\s-]", "", text).strip().lower()
    return re.sub(r"[\s_-]+", "-", text)


def make_unique_slug(db: Session, title: str, exclude_id: Optional[int] = None) -> str:
    base = slugify(title) or "projeto"
    slug = base
    counter = 1
    query = db.query(models.Project).filter(models.Project.slug == slug)
    if exclude_id:
        query = query.filter(models.Project.id != exclude_id)
    while query.first() is not None:
        counter += 1
        slug = f"{base}-{counter}"
        query = db.query(models.Project).filter(models.Project.slug == slug)
        if exclude_id:
            query = query.filter(models.Project.id != exclude_id)
    return slug


def get_projects(
    db: Session,
    category: Optional[str] = None,
    tech: Optional[str] = None,
    q: Optional[str] = None,
    featured_only: bool = False,
) -> List[models.Project]:
    query = db.query(models.Project)

    if category:
        query = query.filter(models.Project.category == category)

    if tech:
        query = query.filter(models.Project.tech_stack.ilike(f"%{tech}%"))

    if q:
        like = f"%{q}%"
        query = query.filter(
            or_(models.Project.title.ilike(like), models.Project.description.ilike(like))
        )

    if featured_only:
        query = query.filter(models.Project.featured.is_(True))

    return query.order_by(models.Project.featured.desc(), models.Project.created_at.desc()).all()


def get_project(db: Session, project_id: int) -> Optional[models.Project]:
    return db.query(models.Project).filter(models.Project.id == project_id).first()


def get_project_by_slug(db: Session, slug: str) -> Optional[models.Project]:
    return db.query(models.Project).filter(models.Project.slug == slug).first()


def create_project(db: Session, data: schemas.ProjectCreate) -> models.Project:
    slug = make_unique_slug(db, data.title)
    project = models.Project(**data.model_dump(), slug=slug)
    db.add(project)
    db.commit()
    db.refresh(project)
    return project


def update_project(
    db: Session, project: models.Project, data: schemas.ProjectUpdate
) -> models.Project:
    update_data = data.model_dump(exclude_unset=True)

    if "title" in update_data and update_data["title"] != project.title:
        project.slug = make_unique_slug(db, update_data["title"], exclude_id=project.id)

    for field, value in update_data.items():
        setattr(project, field, value)

    db.commit()
    db.refresh(project)
    return project


def delete_project(db: Session, project: models.Project) -> None:
    db.delete(project)
    db.commit()


def add_project_image(db: Session, project_id: int, image_path: str, order: int = 0) -> models.ProjectImage:
    image = models.ProjectImage(project_id=project_id, image_path=image_path, order=order)
    db.add(image)
    db.commit()
    db.refresh(image)
    return image


def get_project_image(db: Session, image_id: int) -> Optional[models.ProjectImage]:
    return db.query(models.ProjectImage).filter(models.ProjectImage.id == image_id).first()


def delete_project_image(db: Session, image: models.ProjectImage) -> None:
    db.delete(image)
    db.commit()


def get_books(db: Session) -> List[models.Book]:
    return db.query(models.Book).order_by(models.Book.created_at.desc()).all()


def get_book(db: Session, book_id: int) -> Optional[models.Book]:
    return db.query(models.Book).filter(models.Book.id == book_id).first()


def create_book(db: Session, data: schemas.BookCreate) -> models.Book:
    book = models.Book(**data.model_dump())
    db.add(book)
    db.commit()
    db.refresh(book)
    return book


def update_book(db: Session, book: models.Book, data: schemas.BookUpdate) -> models.Book:
    update_data = data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(book, field, value)
    db.commit()
    db.refresh(book)
    return book


def set_book_cover(db: Session, book: models.Book, cover_image: Optional[str]) -> models.Book:
    book.cover_image = cover_image
    db.commit()
    db.refresh(book)
    return book


def delete_book(db: Session, book: models.Book) -> None:
    db.delete(book)
    db.commit()


def get_publications(db: Session) -> List[models.Publication]:
    return db.query(models.Publication).order_by(
        models.Publication.featured.desc(), models.Publication.order.asc(), models.Publication.created_at.desc()
    ).all()


def get_publication(db: Session, publication_id: int) -> Optional[models.Publication]:
    return db.query(models.Publication).filter(models.Publication.id == publication_id).first()


def create_publication(db: Session, data: schemas.PublicationCreate) -> models.Publication:
    publication = models.Publication(**data.model_dump())
    db.add(publication)
    db.commit()
    db.refresh(publication)
    return publication


def update_publication(
    db: Session, publication: models.Publication, data: schemas.PublicationUpdate
) -> models.Publication:
    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(publication, field, value)
    db.commit()
    db.refresh(publication)
    return publication


def delete_publication(db: Session, publication: models.Publication) -> None:
    db.delete(publication)
    db.commit()


def get_products(db: Session) -> List[models.EducationalProduct]:
    return db.query(models.EducationalProduct).order_by(
        models.EducationalProduct.order.asc(), models.EducationalProduct.created_at.desc()
    ).all()


def get_product(db: Session, product_id: int) -> Optional[models.EducationalProduct]:
    return db.query(models.EducationalProduct).filter(models.EducationalProduct.id == product_id).first()


def create_product(db: Session, data: schemas.EducationalProductCreate) -> models.EducationalProduct:
    product = models.EducationalProduct(**data.model_dump())
    db.add(product)
    db.commit()
    db.refresh(product)
    return product


def update_product(
    db: Session, product: models.EducationalProduct, data: schemas.EducationalProductUpdate
) -> models.EducationalProduct:
    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(product, field, value)
    db.commit()
    db.refresh(product)
    return product


def delete_product(db: Session, product: models.EducationalProduct) -> None:
    db.delete(product)
    db.commit()


def set_product_image(
    db: Session, product: models.EducationalProduct, image_path: Optional[str]
) -> models.EducationalProduct:
    product.image_path = image_path
    db.commit()
    db.refresh(product)
    return product


def get_about_images(db: Session) -> List[models.AboutImage]:
    return db.query(models.AboutImage).order_by(
        models.AboutImage.order.asc(), models.AboutImage.created_at.asc()
    ).all()


def get_about_image(db: Session, image_id: int) -> Optional[models.AboutImage]:
    return db.query(models.AboutImage).filter(models.AboutImage.id == image_id).first()


def add_about_image(
    db: Session,
    image_path: str,
    caption: Optional[str] = None,
    alt_text: Optional[str] = None,
    order: int = 0,
) -> models.AboutImage:
    image = models.AboutImage(
        image_path=image_path,
        caption=caption or None,
        alt_text=alt_text or None,
        order=order,
    )
    db.add(image)
    db.commit()
    db.refresh(image)
    return image


def update_about_image(
    db: Session, image: models.AboutImage, data: schemas.AboutImageUpdate
) -> models.AboutImage:
    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(image, field, value)
    db.commit()
    db.refresh(image)
    return image


def delete_about_image(db: Session, image: models.AboutImage) -> None:
    db.delete(image)
    db.commit()


def reorder_about_images(
    db: Session, items: List[schemas.AboutImageOrderUpdate]
) -> List[models.AboutImage]:
    images_by_id = {
        image.id: image
        for image in db.query(models.AboutImage).filter(
            models.AboutImage.id.in_([item.id for item in items])
        ).all()
    }
    for item in items:
        image = images_by_id.get(item.id)
        if image:
            image.order = item.order
    db.commit()
    return get_about_images(db)


def get_career_content(db: Session):
    timeline = db.query(models.CareerTimelineItem).order_by(
        models.CareerTimelineItem.order.asc(), models.CareerTimelineItem.id.asc()
    ).all()
    highlights = db.query(models.CareerHighlight).order_by(
        models.CareerHighlight.order.asc(), models.CareerHighlight.id.asc()
    ).all()
    return timeline, highlights


def replace_career_content(db: Session, data: schemas.CareerContentUpdate):
    db.query(models.CareerTimelineItem).delete()
    db.query(models.CareerHighlight).delete()
    db.add_all([
        models.CareerTimelineItem(**item.model_dump()) for item in data.timeline
    ])
    db.add_all([
        models.CareerHighlight(**item.model_dump()) for item in data.highlights
    ])
    db.commit()
    return get_career_content(db)


def get_distinct_categories(db: Session) -> List[str]:
    rows = db.query(models.Project.category).filter(models.Project.category.isnot(None)).distinct().all()
    return sorted({r[0] for r in rows if r[0]})
