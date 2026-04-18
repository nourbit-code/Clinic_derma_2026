from django.core.management.base import BaseCommand
from clinic.models import Medication
from pathlib import Path
import csv

def norm(s: str) -> str:
    return " ".join((s or "").strip().split())

class Command(BaseCommand):
    help = "Import medications from a cleaned CSV"

    def add_arguments(self, parser):
        parser.add_argument(
            "--csv",
            dest="csv_path",
            required=True,
            help="Path to medicines_data_clean.csv",
        )
        parser.add_argument(
            "--truncate",
            action="store_true",
            help="Delete all existing medications before import",
        )
        parser.add_argument(
            "--batch",
            type=int,
            default=2000,
            help="Batch size for bulk_create",
        )

    def handle(self, *args, **options):
        csv_path = Path(options["csv_path"]).expanduser().resolve()
        if not csv_path.exists():
            self.stderr.write(self.style.ERROR(f"CSV not found: {csv_path}"))
            return

        if options["truncate"]:
            self.stdout.write("Truncating Medication table...")
            Medication.objects.all().delete()

        existing = set(
            (n.lower(), f.lower(), m.lower())
            for n, f, m in Medication.objects.values_list("name", "form", "manufacturer")
        )
        to_create = []
        created = 0
        skipped = 0

        with csv_path.open("r", encoding="utf-8", newline="") as f:
            reader = csv.DictReader(f)
            for row in reader:
                name = norm(row.get("Drugname", ""))
                if not name:
                    continue
                form = norm(row.get("Form", ""))
                manufacturer = norm(row.get("Company", ""))
                category = norm(row.get("Category", ""))
                region = norm(row.get("Region", ""))
                price_raw = norm(row.get("Price", ""))

                key = (name.lower(), form.lower(), manufacturer.lower())
                if key in existing:
                    skipped += 1
                    continue
                existing.add(key)

                try:
                    price = float(price_raw) if price_raw else 0.0
                except ValueError:
                    price = 0.0

                to_create.append(
                    Medication(
                        name=name,
                        form=form,
                        manufacturer=manufacturer,
                        category=category,
                        region=region,
                        price=price,
                    )
                )

                if len(to_create) >= options["batch"]:
                    Medication.objects.bulk_create(to_create, batch_size=options["batch"])
                    created += len(to_create)
                    to_create = []

        if to_create:
            Medication.objects.bulk_create(to_create, batch_size=options["batch"])
            created += len(to_create)

        self.stdout.write(self.style.SUCCESS(f"Imported: {created}"))
        self.stdout.write(self.style.SUCCESS(f"Skipped (existing): {skipped}"))
