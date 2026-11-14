import json
import openpyxl

SRC = 'Palace Professional Network _Biodata Dashboard - New.xlsx'
OUT = 'members_import.json'

# Real data uses 10-year brackets starting at 20; our app's AGE_RANGES are
# offset by ~2 years. Mapped by which app bucket contains each source
# bracket's midpoint (e.g. midpoint of 20-30 is 25, which sits inside 18-25).
AGE_MAP = {
    '20-30': '18-25',
    '30-40': '26-35',
    '40-50': '36-45',
    '50-60': '46-59',
    '60-70': '60-70',
    '70+': 'Above 70',
}
VALID_SOURCE_AGES = set(AGE_MAP.keys())

BUSINESSMEN_CATEGORY = 'Businessmen and Women (Artisans/Vendors)'

wb = openpyxl.load_workbook(SRC, data_only=True)
ws = wb['Master Data']

imported = []
skipped = {'not_a_real_row': 0, 'missing_phone': 0, 'missing_gender': 0,
           'missing_marital_status': 0, 'missing_place_of_work': 0,
           'missing_profession': 0}
skip_details = []

for row in ws.iter_rows(min_row=2, values_only=True):
    (no, full_name, age, gender, marital, phone, email, place_of_work,
     profession, artisan, vendor, selected_groups) = row[:12]

    if not full_name:
        continue
    if age not in VALID_SOURCE_AGES:
        # Catches the "Professional Coordinators" mini-table appended below
        # the real data, where this column holds names instead of ages.
        skipped['not_a_real_row'] += 1
        continue

    reasons = []
    if not phone or not str(phone).strip():
        reasons.append('missing_phone')
    if not gender:
        reasons.append('missing_gender')
    if not marital:
        reasons.append('missing_marital_status')
    if not place_of_work or not str(place_of_work).strip():
        reasons.append('missing_place_of_work')

    category = profession
    sub_category = None
    if not category:
        if artisan:
            category = BUSINESSMEN_CATEGORY
            sub_category = artisan
        elif vendor:
            category = BUSINESSMEN_CATEGORY
            sub_category = vendor
        else:
            reasons.append('missing_profession')

    if reasons:
        for r in reasons:
            skipped[r] += 1
        skip_details.append({'name': full_name, 'reasons': reasons})
        continue

    imported.append({
        'fullName': str(full_name).strip(),
        'ageRange': AGE_MAP[age],
        'gender': gender,
        'maritalStatus': marital,
        'email': (str(email).strip() if email else None),
        'phoneNumber': str(phone).strip(),
        'professionCategory': category,
        'professionSubCategory': sub_category,
        'placeOfWork': str(place_of_work).strip(),
    })

with open(OUT, 'w', encoding='utf-8') as f:
    json.dump(imported, f, indent=2, ensure_ascii=False)

print(f'Ready to import: {len(imported)}')
print(f'Skipped (not a real data row, e.g. coordinators list): {skipped["not_a_real_row"]}')
print(f'Skipped for missing required fields: {sum(v for k, v in skipped.items() if k != "not_a_real_row")}')
for k, v in skipped.items():
    if k != 'not_a_real_row' and v:
        print(f'  - {k}: {v}')
print()
print('Rows skipped for missing fields (by name):')
for d in skip_details:
    print(f'  - {d["name"]}: {", ".join(d["reasons"])}')
