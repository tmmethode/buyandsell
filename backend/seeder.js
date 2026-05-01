const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('./models/User');
const House = require('./models/House');
const Car = require('./models/Car');
const Plot = require('./models/Plot');
const Job = require('./models/Job');

// Load environment variables
dotenv.config();

// Sample data
const sampleUsers = [
  {
    firstName: 'John',
    lastName: 'Doe',
    email: 'john@example.com',
    phone: '+250780123456',
    password: 'password123',
    role: 'admin',
    isVerified: true
  },
  {
    firstName: 'Jane',
    lastName: 'Smith',
    email: 'jane@example.com',
    phone: '+250781234567',
    password: 'password123',
    role: 'user',
    isVerified: true
  },
  {
    firstName: 'Bob',
    lastName: 'Johnson',
    email: 'bob@example.com',
    phone: '+250782345678',
    password: 'password123',
    role: 'user',
    isVerified: true
  },
  {
    firstName: 'Alice',
    lastName: 'Williams',
    email: 'alice@example.com',
    phone: '+250783456789',
    password: 'password123',
    role: 'user',
    isVerified: true
  },
  {
    firstName: 'Charlie',
    lastName: 'Brown',
    email: 'charlie@example.com',
    phone: '+250784567890',
    password: 'password123',
    role: 'user',
    isVerified: true
  }
];

const sampleHouses = [
  {
    title: "Luxury Villa in Nyarutarama",
    description: "5 beds • 4 baths • 3,200 sqft",
    category: "Luxury House",
    price: "RWF 585,000,000",
    priceNumeric: 585000000,
    location: "Nyarutarama",
    mainImage: "/uploads/houses/house1.png",
    images: ["/uploads/houses/house1.png", "/uploads/houses/house2.png", "/uploads/houses/house3.png"],
    bedrooms: 5,
    bathrooms: 4,
    area: 3200,
    areaUnit: "sqft",
    propertyType: "Villa",
    condition: "Excellent",
    amenities: ["Swimming Pool", "Garden", "Security", "Parking"],
    features: ["Modern Kitchen", "Master Suite", "Balcony"],
    parking: true,
    parkingSpaces: 3,
    furnished: true,
    security: true,
    waterSupply: true,
    electricity: true,
    internet: true,
    contactPhone: "+250780123456",
    contactEmail: "john@example.com",
    status: "Available",
    isFeatured: true
  },
  {
    title: "Luxury Villa in Kabeza",
    description: "3 beds • 2 baths • 1,800 sqft",
    category: "Luxury House",
    price: "RWF 104,000,000",
    priceNumeric: 104000000,
    location: "Kabeza",
    mainImage: "/uploads/houses/house2.png",
    images: ["/uploads/houses/house2.png", "/uploads/houses/house4.png", "/uploads/houses/house5.png"],
    bedrooms: 3,
    bathrooms: 2,
    area: 1800,
    areaUnit: "sqft",
    propertyType: "Villa",
    condition: "Good",
    amenities: ["Garden", "Security", "Parking"],
    features: ["Modern Kitchen", "Balcony"],
    parking: true,
    parkingSpaces: 2,
    furnished: false,
    security: true,
    waterSupply: true,
    electricity: true,
    internet: false,
    contactPhone: "+250781234567",
    contactEmail: "jane@example.com",
    status: "Available",
    isFeatured: true
  },
  {
    title: "Inzu igurishwa mu Gatsata",
    description: "ibyumba 4 na salon • 2 Douche na toilet • 310sqm",
    category: "Middle house",
    price: "RWF 55,000,000",
    priceNumeric: 55000000,
    location: "Gatsata",
    mainImage: "/uploads/houses/house11.jpg",
    images: ["/uploads/houses/house11.jpg", "/uploads/houses/house12.jpg", "/uploads/houses/house13.jpg"],
    bedrooms: 4,
    bathrooms: 2,
    area: 310,
    areaUnit: "sqm",
    propertyType: "House",
    condition: "Good",
    amenities: ["Garden", "Parking"],
    features: ["Living Room", "Kitchen"],
    parking: true,
    parkingSpaces: 1,
    furnished: false,
    security: false,
    waterSupply: true,
    electricity: true,
    internet: false,
    contactPhone: "+250782345678",
    contactEmail: "bob@example.com",
    status: "Available"
  },
  {
    title: "Modern House in Kabeza",
    description: "4 beds • 3 baths • 450sqm",
    category: "Middle house",
    price: "RWF 75,000,000",
    priceNumeric: 75000000,
    location: "Kabeza",
    mainImage: "/uploads/houses/house41.jpg",
    images: ["/uploads/houses/house41.jpg", "/uploads/houses/house51.jpg", "/uploads/houses/house52.jpg"],
    bedrooms: 4,
    bathrooms: 3,
    area: 450,
    areaUnit: "sqm",
    propertyType: "House",
    condition: "Excellent",
    amenities: ["Garden", "Security", "Parking", "Modern Kitchen"],
    features: ["Balcony", "Master Suite", "Home Office"],
    parking: true,
    parkingSpaces: 2,
    furnished: false,
    security: true,
    waterSupply: true,
    electricity: true,
    internet: true,
    contactPhone: "+250783456789",
    contactEmail: "alice@example.com",
    status: "Available"
  },
  {
    title: "Spacious Family Home in Gasogi",
    description: "5 beds • 4 baths • 520sqm",
    category: "Middle house",
    price: "RWF 85,000,000",
    priceNumeric: 85000000,
    location: "Gasogi",
    mainImage: "/uploads/houses/house61.jpg",
    images: ["/uploads/houses/house61.jpg", "/uploads/houses/house62.jpg", "/uploads/houses/house63.jpg"],
    bedrooms: 5,
    bathrooms: 4,
    area: 520,
    areaUnit: "sqm",
    propertyType: "House",
    condition: "Good",
    amenities: ["Garden", "Security", "Parking", "Large Kitchen"],
    features: ["Balcony", "Family Room", "Study", "Utility Room"],
    parking: true,
    parkingSpaces: 3,
    furnished: false,
    security: true,
    waterSupply: true,
    electricity: true,
    internet: true,
    contactPhone: "+250784567890",
    contactEmail: "charlie@example.com",
    status: "Available"
  }
];

const sampleCars = [
  {
    title: "Toyota Camry 2020",
    description: "Automatic • 45,000 km • Petrol",
    category: "Car",
    price: "RWF 32,500,000",
    priceNumeric: 32500000,
    location: "Kigali",
    mainImage: "/uploads/cars/car1.png",
    images: ["/uploads/cars/car1.png", "/uploads/cars/car2.png", "/uploads/cars/car3.png"],
    brand: "Toyota",
    model: "Camry",
    year: 2020,
    mileage: 45000,
    mileageUnit: "km",
    fuelType: "Petrol",
    transmission: "Automatic",
    engineSize: 2.5,
    engineSizeUnit: "L",
    color: "White",
    bodyType: "Sedan",
    doors: 4,
    seats: 5,
    condition: "Excellent",
    features: ["Bluetooth", "Backup Camera", "Cruise Control"],
    safetyFeatures: ["ABS", "Airbags", "Stability Control"],
    comfortFeatures: ["Leather Seats", "Climate Control", "Power Windows"],
    isImported: false,
    hasWarranty: true,
    contactPhone: "+250780123456",
    contactEmail: "john@example.com",
    status: "Available",
    isFeatured: true
  },
  {
    title: "Honda CR-V 2021",
    description: "Automatic • 30,000 km • Petrol",
    category: "SUV",
    price: "RWF 45,500,000",
    priceNumeric: 45500000,
    location: "Kigali",
    mainImage: "/uploads/cars/car2.png",
    images: ["/uploads/cars/car2.png", "/uploads/cars/car4.png", "/uploads/cars/car5.png"],
    brand: "Honda",
    model: "CR-V",
    year: 2021,
    mileage: 30000,
    mileageUnit: "km",
    fuelType: "Petrol",
    transmission: "Automatic",
    engineSize: 1.5,
    engineSizeUnit: "L",
    color: "Black",
    bodyType: "SUV",
    doors: 5,
    seats: 5,
    condition: "Excellent",
    features: ["Bluetooth", "Backup Camera", "Navigation"],
    safetyFeatures: ["ABS", "Airbags", "Lane Assist"],
    comfortFeatures: ["Leather Seats", "Climate Control", "Power Seats"],
    isImported: false,
    hasWarranty: true,
    contactPhone: "+250781234567",
    contactEmail: "jane@example.com",
    status: "Available",
    isFeatured: true
  },
  {
    title: "BMW X3 2022",
    description: "Automatic • 20,000 km • Diesel",
    category: "SUV",
    price: "RWF 58,500,000",
    priceNumeric: 58500000,
    location: "Kigali",
    mainImage: "/uploads/cars/car3.png",
    images: ["/uploads/cars/car3.png", "/uploads/cars/car6.png", "/uploads/cars/car7.png"],
    brand: "BMW",
    model: "X3",
    year: 2022,
    mileage: 20000,
    mileageUnit: "km",
    fuelType: "Diesel",
    transmission: "Automatic",
    engineSize: 2.0,
    engineSizeUnit: "L",
    color: "Blue",
    bodyType: "SUV",
    doors: 5,
    seats: 5,
    condition: "Excellent",
    features: ["Bluetooth", "Backup Camera", "Navigation", "All-Wheel Drive"],
    safetyFeatures: ["ABS", "Airbags", "Stability Control", "Parking Sensors"],
    comfortFeatures: ["Leather Seats", "Climate Control", "Power Seats", "Panoramic Roof"],
    isImported: true,
    hasWarranty: true,
    contactPhone: "+250782345678",
    contactEmail: "bob@example.com",
    status: "Available",
    isFeatured: true
  },
  {
    title: "Toyota Land Cruiser 2019",
    description: "Automatic • 65,000 km • Diesel",
    category: "SUV",
    price: "RWF 85,000,000",
    priceNumeric: 85000000,
    location: "Kigali",
    mainImage: "/uploads/cars/car8.png",
    images: ["/uploads/cars/car8.png", "/uploads/cars/car9.png", "/uploads/cars/car10.png"],
    brand: "Toyota",
    model: "Land Cruiser",
    year: 2019,
    mileage: 65000,
    mileageUnit: "km",
    fuelType: "Diesel",
    transmission: "Automatic",
    engineSize: 4.5,
    engineSizeUnit: "L",
    color: "Silver",
    bodyType: "SUV",
    doors: 5,
    seats: 7,
    condition: "Good",
    features: ["Bluetooth", "Backup Camera", "Navigation", "All-Wheel Drive"],
    safetyFeatures: ["ABS", "Airbags", "Stability Control", "Hill Descent Control"],
    comfortFeatures: ["Leather Seats", "Climate Control", "Power Seats", "Third Row Seating"],
    isImported: false,
    hasWarranty: false,
    contactPhone: "+250783456789",
    contactEmail: "alice@example.com",
    status: "Available"
  }
];

const samplePlots = [
  {
    title: "Ikibanza kigurishwa Gasogi - 633sqm",
    description: "Muri cite y'imiturire",
    category: "Ibibanza",
    price: "RWF 23,000,000",
    priceNumeric: 23000000,
    location: "Gasogi",
    mainImage: "/uploads/plots/plot11.jpg",
    images: ["/uploads/plots/plot11.jpg", "/uploads/plots/plot1.png", "/uploads/plots/plot2.png"],
    area: 633,
    areaUnit: "sqm",
    shape: "Rectangular",
    terrain: "Flat",
    soilType: "Loamy",
    zoning: "Residential",
    landUse: "Residential",
    accessRoad: true,
    roadWidth: 6,
    roadType: "Paved",
    utilities: {
      water: true,
      electricity: true,
      sewage: false,
      internet: false,
      gas: false
    },
    nearbyFacilities: ["School", "Market", "Hospital"],
    titleDeed: true,
    contactPhone: "+250780123456",
    contactEmail: "john@example.com",
    status: "Available",
    isFeatured: true
  },
  {
    title: "Ibibana bigurishwa Kimironko – 324sqm",
    description: "Ni muri R1",
    category: "Ibibanza",
    price: "RWF 18,000,000",
    priceNumeric: 18000000,
    location: "Kimironko",
    mainImage: "/uploads/plots/plot21.jpg",
    images: ["/uploads/plots/plot21.jpg", "/uploads/plots/plot3.png", "/uploads/plots/plot4.png"],
    area: 324,
    areaUnit: "sqm",
    shape: "Square",
    terrain: "Flat",
    soilType: "Clay",
    zoning: "Residential",
    landUse: "Residential",
    accessRoad: true,
    roadWidth: 4,
    roadType: "Gravel",
    utilities: {
      water: true,
      electricity: true,
      sewage: false,
      internet: false,
      gas: false
    },
    nearbyFacilities: ["Market", "Transport"],
    titleDeed: true,
    contactPhone: "+250781234567",
    contactEmail: "jane@example.com",
    status: "Available"
  },
  {
    title: "Ibibana bigurishwa Nyarufunzo – 324sqm",
    description: "Ni muri R1",
    category: "Ibibanza",
    price: "RWF 16,000,000",
    priceNumeric: 16000000,
    location: "Nyarufunzo",
    mainImage: "/uploads/plots/plot31.jpg",
    images: ["/uploads/plots/plot31.jpg", "/uploads/plots/plot5.png", "/uploads/plots/plot6.png"],
    area: 324,
    areaUnit: "sqm",
    shape: "Rectangular",
    terrain: "Slightly Sloped",
    soilType: "Sandy",
    zoning: "Residential",
    landUse: "Residential",
    accessRoad: true,
    roadWidth: 5,
    roadType: "Gravel",
    utilities: {
      water: true,
      electricity: true,
      sewage: false,
      internet: false,
      gas: false
    },
    nearbyFacilities: ["School", "Market", "Park"],
    titleDeed: true,
    contactPhone: "+250782345678",
    contactEmail: "bob@example.com",
    status: "Available"
  },
  {
    title: "Commercial Plot in Kabeza - 450sqm",
    description: "Perfect for business development",
    category: "Commercial Plot",
    price: "RWF 35,000,000",
    priceNumeric: 35000000,
    location: "Kabeza",
    mainImage: "/uploads/plots/plot41.jpg",
    images: ["/uploads/plots/plot41.jpg", "/uploads/plots/plot7.png", "/uploads/plots/plot8.png"],
    area: 450,
    areaUnit: "sqm",
    shape: "Rectangular",
    terrain: "Flat",
    soilType: "Mixed",
    zoning: "Commercial",
    landUse: "Commercial",
    accessRoad: true,
    roadWidth: 8,
    roadType: "Paved",
    utilities: {
      water: true,
      electricity: true,
      sewage: true,
      internet: true,
      gas: false
    },
    nearbyFacilities: ["Business District", "Transport Hub", "Shopping Centers"],
    titleDeed: true,
    contactPhone: "+250783456789",
    contactEmail: "alice@example.com",
    status: "Available"
  }
];

const sampleJobs = [
  {
    title: "Backend Developer",
    description: "5+ years experience • Full-time",
    category: "Technology",
    salary: "RWF 2,600,000/mo",
    salaryMin: 2600000,
    salaryMax: 2600000,
    salaryCurrency: "RWF",
    salaryPeriod: "monthly",
    location: "Kigali",
    jobType: "Full-time",
    experienceLevel: "Senior",
    educationLevel: "Bachelor",
    requiredSkills: ["Node.js", "MongoDB", "Express.js", "JavaScript"],
    preferredSkills: ["TypeScript", "Docker", "AWS"],
    responsibilities: [
      "Develop and maintain backend services",
      "Design and implement APIs",
      "Optimize database performance"
    ],
    benefits: ["Health Insurance", "Remote Work", "Professional Development"],
    company: {
      name: "Tech Solutions Rwanda",
      size: "51-200",
      industry: "Technology"
    },
    contactPerson: {
      name: "HR Manager",
      email: "hr@techsolutions.rw",
      phone: "+250780123456"
    },
    applicationDeadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
    isRemote: true,
    remotePercentage: 80,
    isUrgent: false,
    isFeatured: true,
    status: "Active"
  },
  {
    title: "Graphic Designer",
    description: "Creative role • Part-time",
    category: "Design",
    salary: "RWF 1,560,000/mo",
    salaryMin: 1560000,
    salaryMax: 1560000,
    salaryCurrency: "RWF",
    salaryPeriod: "monthly",
    location: "Remote",
    jobType: "Part-time",
    experienceLevel: "Mid Level",
    educationLevel: "Bachelor",
    requiredSkills: ["Adobe Creative Suite", "Photoshop", "Illustrator", "Design Principles"],
    preferredSkills: ["Figma", "UI/UX Design", "Branding"],
    responsibilities: [
      "Create visual designs for marketing materials",
      "Design social media graphics",
      "Maintain brand consistency"
    ],
    benefits: ["Flexible Hours", "Remote Work", "Creative Freedom"],
    company: {
      name: "Creative Agency Rwanda",
      size: "11-50",
      industry: "Marketing"
    },
    contactPerson: {
      name: "Creative Director",
      email: "creative@agency.rw",
      phone: "+250781234567"
    },
    applicationDeadline: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000), // 21 days from now
    isRemote: true,
    remotePercentage: 100,
    isUrgent: false,
    isFeatured: false,
    status: "Active"
  },
  {
    title: "Frontend Developer",
    description: "React.js specialist • Full-time",
    category: "Technology",
    salary: "RWF 2,200,000/mo",
    salaryMin: 2200000,
    salaryMax: 2200000,
    salaryCurrency: "RWF",
    salaryPeriod: "monthly",
    location: "Kigali",
    jobType: "Full-time",
    experienceLevel: "Mid Level",
    educationLevel: "Bachelor",
    requiredSkills: ["React.js", "JavaScript", "HTML/CSS", "Git", "Responsive Design"],
    preferredSkills: ["TypeScript", "Next.js", "Tailwind CSS", "Redux", "Testing"],
    responsibilities: [
      "Build responsive user interfaces",
      "Implement modern React patterns",
      "Optimize application performance",
      "Collaborate with UI/UX designers",
      "Write clean, maintainable code"
    ],
    benefits: ["Health Insurance", "Remote Work", "Learning Budget", "Team Events"],
    company: {
      name: "Digital Innovations Rwanda",
      size: "11-50",
      industry: "Technology"
    },
    contactPerson: {
      name: "Tech Lead",
      email: "tech@digitalinnovations.rw",
      phone: "+250782345678"
    },
    applicationDeadline: new Date(Date.now() + 25 * 24 * 60 * 60 * 1000), // 25 days from now
    isRemote: true,
    remotePercentage: 60,
    isUrgent: true,
    isFeatured: true,
    status: "Active"
  },
  {
    title: "Marketing Manager",
    description: "Digital marketing expert • Full-time",
    category: "Marketing",
    salary: "RWF 3,500,000/mo",
    salaryMin: 3500000,
    salaryMax: 3500000,
    salaryCurrency: "RWF",
    salaryPeriod: "monthly",
    location: "Kigali",
    jobType: "Full-time",
    experienceLevel: "Senior",
    educationLevel: "Bachelor",
    requiredSkills: ["Digital Marketing", "Social Media", "Content Strategy", "Analytics", "Team Leadership"],
    preferredSkills: ["Google Ads", "Facebook Ads", "SEO", "Email Marketing", "CRM Systems"],
    responsibilities: [
      "Develop and execute marketing strategies",
      "Manage digital marketing campaigns",
      "Lead marketing team",
      "Analyze campaign performance",
      "Build brand awareness"
    ],
    benefits: ["Health Insurance", "Performance Bonus", "Professional Development", "Flexible Hours"],
    company: {
      name: "Growth Marketing Rwanda",
      size: "51-200",
      industry: "Marketing"
    },
    contactPerson: {
      name: "CEO",
      email: "ceo@growthmarketing.rw",
      phone: "+250783456789"
    },
    applicationDeadline: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000), // 20 days from now
    isRemote: false,
    remotePercentage: 20,
    isUrgent: false,
    isFeatured: true,
    status: "Active"
  }
];

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('MongoDB connection error:', err));

// Seed data function
const seedData = async () => {
  try {
    // Clear existing data
    await User.deleteMany();
    await House.deleteMany();
    await Car.deleteMany();
    await Plot.deleteMany();
    await Job.deleteMany();

    console.log('Cleared existing data');

    // Create users
    const createdUsers = await User.create(sampleUsers);
    console.log(`Created ${createdUsers.length} users`);

    // Create houses with owner references
    const housesWithOwners = sampleHouses.map((house, index) => ({
      ...house,
      owner: createdUsers[index % createdUsers.length]._id
    }));
    const createdHouses = await House.create(housesWithOwners);
    console.log(`Created ${createdHouses.length} houses`);

    // Create cars with owner references
    const carsWithOwners = sampleCars.map((car, index) => ({
      ...car,
      owner: createdUsers[index % createdUsers.length]._id
    }));
    const createdCars = await Car.create(carsWithOwners);
    console.log(`Created ${createdCars.length} cars`);

    // Create plots with owner references
    const plotsWithOwners = samplePlots.map((plot, index) => ({
      ...plot,
      owner: createdUsers[index % createdUsers.length]._id
    }));
    const createdPlots = await Plot.create(plotsWithOwners);
    console.log(`Created ${createdPlots.length} plots`);

    // Create jobs with poster references
    const jobsWithPosters = sampleJobs.map((job, index) => ({
      ...job,
      postedBy: createdUsers[index % createdUsers.length]._id
    }));
    const createdJobs = await Job.create(jobsWithPosters);
    console.log(`Created ${createdJobs.length} jobs`);

    // Update users with favorites
    for (let i = 0; i < createdUsers.length; i++) {
      const user = createdUsers[i];
      user.favorites = [
        createdHouses[i % createdHouses.length]._id,
        createdCars[i % createdCars.length]._id,
        createdPlots[i % createdPlots.length]._id,
        createdJobs[i % createdJobs.length]._id
      ];
      await user.save();
    }

    console.log('Updated users with favorites');

    console.log('Data seeding completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding data:', error);
    process.exit(1);
  }
};

// Run seeder
seedData();
