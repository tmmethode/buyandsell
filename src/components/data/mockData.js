import { Home, Car, MapPin, Briefcase, ArrowRight } from "lucide-react";
import car1 from "../images/car1.png";
import car2 from "../images/car2.png";
import car3 from "../images/car3.png";
import car4 from "../images/car4.png";
import car5 from "../images/car5.png";
import car6 from "../images/car6.png";
import car7 from "../images/car7.png";
import house1 from "../images/house1.png";
import house2 from "../images/house2.png";
import house3 from "../images/house3.png";
import house11 from "../images/house11.jpg";
import house12 from "../images/house12.jpg";
import house13 from "../images/house13.jpg";
import house14 from "../images/house14.jpg";
import house15 from "../images/house15.jpg";
import house16 from "../images/house16.jpg";
import house17 from "../images/house17.jpg";
import house21 from "../images/house21.jpg";
import house22 from "../images/house22.jpg";
import house31 from "../images/house31.jpg";
import house32 from "../images/house32.jpg";
import house41 from "../images/house41.jpg";
import house51 from "../images/house51.jpg";
import house52 from "../images/house52.jpg";
import house53 from "../images/house53.jpg";
import house61 from "../images/house61.jpg";
import house62 from "../images/house62.jpg";
import house63 from "../images/house63.jpg";
import house64 from "../images/house64.jpg";
import house71 from "../images/house71.jpg";
import house81 from "../images/house81.jpg";
import house91 from "../images/house91.jpg";
import house110 from "../images/house110.jpg";
import house120 from "../images/house120.jpg";
import house121 from "../images/house121.jpg";
import house123 from "../images/house123.jpg";
import house131 from "../images/house131.jpg";
import house132 from "../images/house132.jpg";
import house133 from "../images/house133.jpg";
import house134 from "../images/house134.jpg";
import house141 from "../images/house141.jpg";
import house151 from "../images/house151.jpg";
import house161 from "../images/house161.jpg";
import house171 from "../images/house171.jpg";
import person1 from "../images/person1.png";
import person2 from "../images/person2.png";
import person3 from "../images/person3.png";
import plot11 from "../images/plot11.jpg";
import plot21 from "../images/plot21.jpg";
import plot31 from "../images/plot31.jpg";
import plot41 from "../images/plot41.jpg";
import plot51 from "../images/plot51.jpg";
import plot61 from "../images/plot61.jpg";
import plot62 from "../images/plot62.jpg";
import plot71 from "../images/plot71.jpg";

export const luxuryHouses = [
  {
    image: house1,
    title: "Luxury Villa in Nyarutarama",
    description: "5 beds • 4 baths • 3,200 sqft",
    category: "Luxury House",
    price: "RWF 585,000,000",
    location: "Nyarutarama",
  },
  {
    image: house2,
    title: "Luxury Villa in Kabeza",
    description: "3 beds • 2 baths • 1,800 sqft",
    category: "Luxury House",
    price: "RWF 104,000,000",
    location: "Kabeza",
  },
  {
    image: house3,
    title: "Luxury Villa in Kigarama",
    description: "3 beds • 2 baths • 1,800 sqft",
    category: "Luxury House",
    price: "RWF 49,400,000",
    location: "Kigali",
  },
];

export const mockData = [
  {
    image: house11,
    title: "Inzu igurishwa mu Gatsata",
    description: "ibyumba 4 na salon • 2 Douche na toilet • 310sqm",
    category: "Middle house",
    price: "RWF 55,000,000",
    location: "Gatsata",
  },
  {
    image: house21,
    title: "Inzu igurishwa Nyamirambo",
    description: "Ibyumba 4 na salon • Douche na toilet 1 • 680sqm",
    category: "Middle house",
    price: "RWF 40,000,000",
    location: "Nyamirambo",
  },
  {
    image: house31,
    title: "inzu ikodeshwa Kabeza",
    description: "Ibyuma 4 na salon • Douche na toilet 3",
    category: "Inzu ikodeshwa",
    price: "RWF 800,000",
    location: "Kabeza",
  },
  // {
  //   image: house51,
  //   title: "Imiryango y'ubucuruzi igurishwa",
  //   description: "Imiryango 6 • 320sqm",
  //   category: "Luxury House",
  //   price: "RWF 150,000,000",
  //   location: "Kabeza",
  // },
  // {
  //   image: house61,
  //   title: "Inzu igurishwa Gasogi",
  //   description: "Inyumba 4 na Salon • Sale manger • Douche na toilet 2 • 310sqm",
  //   category: "Middle house",
  //   price: "RWF 55,000,000",
  //   location: "Gasogi",
  // },
];

export const carsData = [
  {
    image: car1,
    title: "Toyota Camry 2020",
    description: "Automatic • 45,000 km • Petrol",
    category: "Car",
    price: "RWF 32,500,000",
    location: "Kigali",
  },
  {
    image: car2,
    title: "Honda CR-V 2021",
    description: "Automatic • 30,000 km • Petrol",
    category: "Car",
    price: "RWF 45,500,000",
    location: "Kigali",
  },
  {
    image: car3,
    title: "BMW X3 2022",
    description: "Automatic • 20,000 km • Diesel",
    category: "Car",
    price: "RWF 58,500,000",
    location: "Kigali",
  },
];

export const plotData = [
  {
    image: plot11,
    title: "Ikibanza kigurishwa Gasogi - 633sqm",
    description: "Muri cite y'imiturire",
    category: "Ibibanza",
    price: "RWF 23,000,000",
    location: "Gasogi",
  },
  {
    image: plot21,
    title: "Ibibana bigurishwa Kimironko – 324sqm",
    description: "Ni muri R1",
    category: "Ibibanza",
    price: "RWF 18,000,000",
    location: "Kimironko",
  },
  {
    image: plot31,
    title: "Ibibana bigurishwa Nyarufunzo – 324sqm",
    description: "Ni muri R1",
    category: "Ibibanza",
    price: "RWF 16,000,000",
    location: "Nyarufunzo",
  },
];

export const jobData = [
  {
    image: person1,
    title: "Backend Developer",
    description: "5+ years experience • Full-time",
    category: "Job",
    price: "Salary: RWF 2,600,000/mo",
    location: "Kigali",
  },
  {
    image: person2,
    title: "Graphic Designer",
    description: "Creative role • Part-time",
    category: "Job",
    price: "Salary: RWF 1,560,000/mo",
    location: "Remote",
  },
  {
    image: person3,
    title: "Graphic Designer",
    description: "Creative role • Part-time",
    category: "Job",
    price: "Salary: RWF 1,560,000/mo",
    location: "Remote",
  },
];

export const servicesData = [
  {
    id: 1,
    icon: Home,
    title: "Sell a House",
    description: "List your property",
    buttonText: "Start Selling",
  },
  {
    id: 2,
    icon: Car,
    title: "Sell a Car",
    description: "List your vehicle",
    buttonText: "Start Selling",
  },
  {
    id: 3,
    icon: MapPin,
    title: "Sell a Plot",
    description: "List your land",
    buttonText: "Start Selling",
  },
  {
    id: 4,
    icon: Briefcase,
    title: "Post a Job",
    description: "Hire talent",
    buttonText: "Post Job",
  },
];

export const servicesOfferData = [
  {
    id: 1,
    icon: Home,
    title: "House Sales",
    description:
      "Find your dream home with our extensive collection of residential properties and premium locations.",
  },
  {
    id: 2,
    icon: Car,
    title: "Car Sales",
    description:
      "Browse through our selection of quality vehicles for sale and rent with competitive pricing.",
  },
  {
    id: 3,
    icon: MapPin,
    title: "Plot Sales",
    description:
      "Invest in prime land plots for residential and commercial development in strategic locations.",
  },
  {
    id: 4,
    icon: Briefcase,
    title: "Job Services",
    description:
      "Connect with job opportunities and talented professionals across Rwanda's growing market.",
  },
];
