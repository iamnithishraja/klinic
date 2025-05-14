const getCities = () => {
    const cities = [
        "Delhi",
        "Mumbai",
        "Bangalore",
        "Hyderabad",
        "Chennai",
        "Kolkata",
        "Pune",
        "Ahmedabad",
        "Surat",
        "Jaipur",
        "Lucknow",
        "Kanpur",
        "Nagpur",
        "Bhopal",
        "Lucknow",
        "Kanpur",
        "Nagpur",
        "Indore",
        "Bhopal",
    ];
    return cities;
}

const getSpecializations = () => {
    const specializations = [
        "Cardiologist",
        "Dermatologist",
        "Pediatrician",
        "Neurologist",
        "Orthopedic Surgeon",
        "Gynecologist",
        "Urologist",
        "ENT Specialist",
        "General Surgeon",
        "General Physician",
        "Dentist",
    ];
    return specializations;
}

const getQualifications = () => {
    const qualifications = [
        "MBBS",
        "MD",
        "MS",
        "M.Ch",
        "M.D",
        "M.S",
        "M.Ch",
        "M.S",
    ]
    return qualifications;
}

const getCategoriesTestType = () => {
    const categories = [
        "Blood",
        "Urine",
        "Stool",
        "X-Ray",
        "CT Scan",
        "MRI",
        "Ultrasound",
        "Other",
    ]
    return categories;
}

export { getCities, getSpecializations, getQualifications, getCategoriesTestType };