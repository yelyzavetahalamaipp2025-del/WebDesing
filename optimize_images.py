
from pathlib import Path
from datetime import datetime
from io import BytesIO
import os
import shutil

from PIL import Image, ImageOps


# Папка проєкту AgroNext
root = Path(__file__).resolve().parent

# Папка фотографій товарів
images_dir = root / "assets" / "images"

# Параметри оптимізації
max_size = 1400
quality = 78

if not images_dir.is_dir():
    raise SystemExit(
        "Помилка: папку assets/images не знайдено."
    )

# Знаходимо JPEG-фотографії
images = sorted(
    path for path in images_dir.rglob("*")
    if path.is_file()
    and path.suffix.lower() in (".jpg", ".jpeg")
)

if not images:
    raise SystemExit(
        "JPEG-фотографій для оптимізації не знайдено."
    )

# Резервні копії поза папкою сайту
backup_dir = root.parent / (
    "AgroNext_images_backup_"
    + datetime.now().strftime("%Y%m%d_%H%M%S_%f")
)

backup_dir.mkdir(parents=True, exist_ok=False)

optimized = 0
saved_bytes = 0

print(f"Знайдено фотографій: {len(images)}")
print("----------------------------------")

for path in images:
    try:
        old_size = path.stat().st_size

        with Image.open(path) as source:
            photo = ImageOps.exif_transpose(source)

            if photo.mode != "RGB":
                photo = photo.convert("RGB")

            # Зберігаємо пропорції
            photo.thumbnail(
                (max_size, max_size),
                Image.Resampling.LANCZOS
            )

            output = BytesIO()

            photo.save(
                output,
                format="JPEG",
                quality=quality,
                optimize=True,
                progressive=True,
                subsampling=2
            )

        new_data = output.getvalue()
        new_size = len(new_data)

        # Замінюємо тільки якщо економія від 5%
        if new_size >= old_size * 0.95:
            print(f"Без змін: {path.name}")
            continue

        # Зберігаємо оригінал
        relative = path.relative_to(images_dir)
        backup_path = backup_dir / relative

        backup_path.parent.mkdir(
            parents=True,
            exist_ok=True
        )

        shutil.copy2(path, backup_path)

        # Безпечна заміна файла
        temporary = path.with_name(path.name + ".new")

        temporary.write_bytes(new_data)
        os.replace(temporary, path)

        optimized += 155    
        saved_bytes += old_size - new_size

        percent = (1 - new_size / old_size) * 100

        print(
            f"Оптимізовано: {path.name} "
            f"(-{percent:.1f}%)"
        )

    except Exception as error:
        print(f"Пропущено {path.name}: {error}")

print("----------------------------------")
print(f"Оптимізовано фотографій: {optimized}")

print(
    "Загальна економія: "
    f"{saved_bytes / 1024:.1f} КіБ"
)

print(f"Резервні копії: {backup_dir}")
print("Готово!")

