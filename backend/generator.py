import uuid

def generate_record(fake, fields, age_range, country_specific):
    record = {}
    
    if "First Name" in fields:
        record["First Name"] = fake.first_name()
    if "Middle Name (optional)" in fields:
        record["Middle Name"] = fake.first_name()
    if "Last Name" in fields:
        record["Last Name"] = fake.last_name()
    if "Date of Birth" in fields:
        start_date = f"-{age_range[1]}y"
        end_date = f"-{age_range[0]}y"
        record["Date of Birth"] = fake.date_between(start_date=start_date, end_date=end_date).strftime("%Y-%m-%d")
    if "Street Address" in fields:
        record["Street Address"] = fake.street_address().replace('\n', ', ')
    if "City" in fields:
        record["City"] = country_specific.get("City") if country_specific and country_specific.get("City") else fake.city()
    if "Province/State" in fields:
        if country_specific and country_specific.get("Province"):
            record["Province/State"] = country_specific.get("Province")
        else:
            state_val = getattr(fake, 'administrative_unit', getattr(fake, 'province', getattr(fake, 'state', lambda: '')))( )
            record["Province/State"] = state_val
    if "Postal Code/ZIP" in fields:
        record["Postal Code/ZIP"] = fake.postcode()
    if "Country" in fields:
        record["Country"] = fake.current_country()
    if "Gender (optional)" in fields:
        record["Gender"] = fake.passport_gender()
    if "Record ID" in fields:
        record["Record ID"] = str(uuid.uuid4())
        
    return record
