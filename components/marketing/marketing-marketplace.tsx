"use client"
// territories marketplace - v2
import { useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Check, ShoppingCart, Zap, MapPin, TrendingUp, Users, ArrowRight, Package, Palette, Upload, Eye, Search } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"

interface TerritoryListing {
  id: string
  city: string
  region: string // Parent city/county
  county: string
  state: string
  type: "city" | "neighborhood" | "town" | "suburb" | "community"
  avgHomePrice: number
  activeListings: number
  monthlyLeads: number
  marketDemand: "high" | "medium" | "low"
  price: number
  icon: React.ReactNode
  popular?: boolean
  image: string
  spotsAvailable: number
  totalSpots: number
}

interface VAPackage {
  id: string
  name: string
  hours: number
  price: number
  hourlyRate: number
  features: string[]
  popular?: boolean
}

interface PhysicalProduct {
  id: string
  name: string
  category: string
  description: string
  price: number
  quantity?: string
  features: string[]
  popular?: boolean
  customFields: string[]
  image: string
}

interface ProductCustomization {
  agentName: string
  phone: string
  email: string
  brokerage: string
  tagline: string
  colorScheme: string
  logoUrl: string
  quantity: number
}

// Helper to generate territory listings
const createTerritory = (
  city: string,
  region: string,
  county: string,
  type: "city" | "neighborhood" | "town" | "suburb" | "community",
  avgHomePrice: number,
  monthlyLeads: number,
  marketDemand: "high" | "medium" | "low",
  price: number,
  spotsAvailable: number,
  popular?: boolean
): TerritoryListing => ({
  id: `territory-${city.toLowerCase().replace(/[^a-z0-9]/g, '-')}`,
  city,
  region,
  county,
  state: "FL",
  type,
  avgHomePrice,
  activeListings: Math.floor(monthlyLeads * 0.6),
  monthlyLeads,
  marketDemand,
  price,
  icon: <MapPin className="h-6 w-6" />,
  popular,
  image: `/images/territories/${city.toLowerCase().replace(/[^a-z0-9]/g, '-')}.jpg`,
  spotsAvailable,
  totalSpots: 3,
})

const TERRITORY_LISTINGS: TerritoryListing[] = [
  // ========================================
  // CENTRAL FLORIDA - ORANGE COUNTY
  // ========================================
  
  // Orlando - Main City
  createTerritory("Orlando", "Orlando Metro", "Orange", "city", 450000, 320, "high", 299, 1, true),
  createTerritory("Downtown Orlando", "Orlando", "Orange", "neighborhood", 580000, 185, "high", 249, 2, true),
  createTerritory("Thornton Park", "Orlando", "Orange", "neighborhood", 620000, 145, "high", 229, 1),
  createTerritory("Lake Eola Heights", "Orlando", "Orange", "neighborhood", 550000, 135, "high", 219, 2),
  createTerritory("Parramore", "Orlando", "Orange", "neighborhood", 280000, 125, "low", 99, 3),
  createTerritory("College Park", "Orlando", "Orange", "neighborhood", 520000, 175, "high", 199, 2),
  createTerritory("Mills 50", "Orlando", "Orange", "neighborhood", 480000, 165, "high", 189, 2),
  createTerritory("Colonialtown", "Orlando", "Orange", "neighborhood", 450000, 155, "medium", 179, 3),
  createTerritory("Audubon Park", "Orlando", "Orange", "neighborhood", 490000, 145, "high", 189, 2),
  createTerritory("Baldwin Park", "Orlando", "Orange", "neighborhood", 620000, 175, "high", 229, 1, true),
  createTerritory("Lake Nona", "Orlando", "Orange", "community", 580000, 210, "high", 249, 1, true),
  createTerritory("Lake Nona Medical City", "Lake Nona", "Orange", "neighborhood", 650000, 145, "high", 229, 2),
  createTerritory("Lake Nona Town Center", "Lake Nona", "Orange", "neighborhood", 550000, 135, "high", 199, 3),
  createTerritory("Laureate Park", "Lake Nona", "Orange", "neighborhood", 520000, 125, "high", 189, 3),
  createTerritory("Narcoossee", "Lake Nona", "Orange", "neighborhood", 480000, 155, "medium", 169, 3),
  createTerritory("Avalon Park", "Orlando", "Orange", "community", 420000, 185, "medium", 149, 2),
  createTerritory("Waterford Lakes", "Orlando", "Orange", "community", 410000, 175, "medium", 139, 3),
  createTerritory("Hunters Creek", "Orlando", "Orange", "community", 420000, 180, "medium", 149, 2),
  createTerritory("MetroWest", "Orlando", "Orange", "neighborhood", 380000, 165, "medium", 129, 3),
  createTerritory("Millenia", "Orlando", "Orange", "neighborhood", 350000, 145, "medium", 119, 3),
  createTerritory("Dr. Phillips", "Orlando", "Orange", "neighborhood", 680000, 195, "high", 239, 1, true),
  createTerritory("Bay Hill", "Dr. Phillips", "Orange", "community", 850000, 125, "high", 279, 2),
  createTerritory("Sand Lake", "Dr. Phillips", "Orange", "neighborhood", 520000, 145, "medium", 179, 3),
  createTerritory("Restaurant Row", "Dr. Phillips", "Orange", "neighborhood", 450000, 135, "medium", 159, 3),
  createTerritory("Rosemont", "Orlando", "Orange", "neighborhood", 340000, 155, "low", 109, 3),
  createTerritory("Pine Hills", "Orlando", "Orange", "neighborhood", 290000, 175, "low", 90, 3),
  createTerritory("Holden Heights", "Orlando", "Orange", "neighborhood", 310000, 145, "low", 99, 3),
  createTerritory("Rio Grande Park", "Orlando", "Orange", "neighborhood", 350000, 135, "low", 109, 3),
  createTerritory("Oak Ridge", "Orlando", "Orange", "neighborhood", 340000, 155, "low", 109, 3),
  createTerritory("Sky Lake", "Orlando", "Orange", "neighborhood", 420000, 145, "medium", 139, 3),
  createTerritory("Conway", "Orlando", "Orange", "neighborhood", 450000, 165, "medium", 149, 3),
  createTerritory("Delaney Park", "Orlando", "Orange", "neighborhood", 520000, 155, "high", 189, 2),
  createTerritory("SoDo", "Orlando", "Orange", "neighborhood", 420000, 145, "medium", 159, 3),
  createTerritory("Meadow Woods", "Orlando", "Orange", "community", 380000, 185, "medium", 129, 3),
  createTerritory("Southchase", "Orlando", "Orange", "community", 420000, 175, "medium", 149, 3),
  createTerritory("Vista East", "Orlando", "Orange", "community", 390000, 155, "medium", 129, 3),
  createTerritory("Wetherbee", "Orlando", "Orange", "neighborhood", 410000, 145, "medium", 139, 3),
  createTerritory("UCF Area", "Orlando", "Orange", "neighborhood", 380000, 195, "medium", 129, 3),
  createTerritory("Alafaya", "Orlando", "Orange", "neighborhood", 390000, 185, "medium", 129, 3),
  createTerritory("Azalea Park", "Orlando", "Orange", "neighborhood", 380000, 165, "low", 119, 3),
  createTerritory("Union Park", "Orlando", "Orange", "neighborhood", 360000, 155, "low", 109, 3),
  createTerritory("Bithlo", "Orlando", "Orange", "town", 280000, 115, "low", 90, 3),
  createTerritory("Christmas", "Orlando", "Orange", "town", 320000, 95, "low", 90, 3),
  
  // Winter Park
  createTerritory("Winter Park", "Orlando Metro", "Orange", "city", 780000, 195, "high", 299, 1, true),
  createTerritory("Park Avenue", "Winter Park", "Orange", "neighborhood", 1200000, 145, "high", 349, 1),
  createTerritory("Hannibal Square", "Winter Park", "Orange", "neighborhood", 680000, 135, "high", 249, 2),
  createTerritory("Winter Park Village", "Winter Park", "Orange", "neighborhood", 720000, 125, "high", 259, 2),
  createTerritory("Baldwin Park East", "Winter Park", "Orange", "neighborhood", 580000, 145, "high", 219, 2),
  createTerritory("Windsong", "Winter Park", "Orange", "neighborhood", 620000, 115, "high", 229, 3),
  createTerritory("Fairbanks", "Winter Park", "Orange", "neighborhood", 520000, 125, "medium", 189, 3),
  createTerritory("Lakeside", "Winter Park", "Orange", "neighborhood", 750000, 115, "high", 269, 2),
  
  // Windermere & Surrounding
  createTerritory("Windermere", "Orlando Metro", "Orange", "town", 1200000, 165, "high", 349, 1, true),
  createTerritory("Isleworth", "Windermere", "Orange", "community", 2500000, 85, "high", 449, 1),
  createTerritory("Keene's Pointe", "Windermere", "Orange", "community", 1500000, 95, "high", 379, 2),
  createTerritory("Lake Butler Sound", "Windermere", "Orange", "community", 1100000, 105, "high", 329, 2),
  createTerritory("Butler Bay", "Windermere", "Orange", "community", 950000, 115, "high", 299, 3),
  createTerritory("Gotha", "Windermere", "Orange", "town", 680000, 125, "medium", 219, 3),
  
  // Winter Garden & West Orange
  createTerritory("Winter Garden", "Orlando Metro", "Orange", "city", 480000, 210, "high", 189, 2, true),
  createTerritory("Downtown Winter Garden", "Winter Garden", "Orange", "neighborhood", 550000, 145, "high", 209, 2),
  createTerritory("Horizon West", "Winter Garden", "Orange", "community", 520000, 225, "high", 199, 1),
  createTerritory("Waterleigh", "Horizon West", "Orange", "community", 480000, 165, "medium", 179, 3),
  createTerritory("Summerlake", "Horizon West", "Orange", "community", 450000, 155, "medium", 169, 3),
  createTerritory("Lakeside at Town Center", "Horizon West", "Orange", "community", 520000, 145, "high", 189, 3),
  createTerritory("Oakland", "Winter Garden", "Orange", "town", 480000, 125, "medium", 169, 3),
  createTerritory("Ocoee", "Orlando Metro", "Orange", "city", 420000, 185, "medium", 159, 2),
  createTerritory("Clarke's Landing", "Ocoee", "Orange", "community", 450000, 135, "medium", 169, 3),
  createTerritory("West Oaks", "Ocoee", "Orange", "community", 380000, 145, "medium", 139, 3),
  
  // Apopka & North Orange
  createTerritory("Apopka", "Orlando Metro", "Orange", "city", 380000, 195, "medium", 139, 2),
  createTerritory("Wekiva Springs", "Apopka", "Orange", "neighborhood", 450000, 155, "medium", 169, 3),
  createTerritory("Rock Springs", "Apopka", "Orange", "neighborhood", 420000, 145, "medium", 159, 3),
  createTerritory("Errol Estate", "Apopka", "Orange", "community", 380000, 125, "medium", 139, 3),
  createTerritory("Piedmont", "Apopka", "Orange", "neighborhood", 350000, 135, "low", 119, 3),
  createTerritory("Zellwood", "Apopka", "Orange", "town", 320000, 115, "low", 99, 3),
  createTerritory("Tangerine", "Apopka", "Orange", "town", 340000, 105, "low", 109, 3),
  
  // Maitland & Eatonville
  createTerritory("Maitland", "Orlando Metro", "Orange", "city", 580000, 165, "high", 209, 2),
  createTerritory("Dommerich Estates", "Maitland", "Orange", "neighborhood", 720000, 115, "high", 249, 2),
  createTerritory("Lake Maitland", "Maitland", "Orange", "neighborhood", 850000, 95, "high", 279, 2),
  createTerritory("Eatonville", "Orlando Metro", "Orange", "town", 290000, 115, "low", 90, 3),
  
  // Belle Isle & South Orange
  createTerritory("Belle Isle", "Orlando Metro", "Orange", "city", 450000, 145, "medium", 169, 3),
  createTerritory("Edgewood", "Orlando Metro", "Orange", "city", 420000, 125, "medium", 159, 3),
  
  // ========================================
  // CENTRAL FLORIDA - SEMINOLE COUNTY
  // ========================================
  
  // Sanford
  createTerritory("Sanford", "Orlando Metro", "Seminole", "city", 380000, 195, "medium", 149, 2),
  createTerritory("Downtown Sanford", "Sanford", "Seminole", "neighborhood", 450000, 145, "medium", 179, 2),
  createTerritory("Historic District", "Sanford", "Seminole", "neighborhood", 480000, 125, "medium", 189, 3),
  createTerritory("Mayfair", "Sanford", "Seminole", "community", 350000, 135, "medium", 129, 3),
  createTerritory("Lake Mary-Sanford", "Sanford", "Seminole", "neighborhood", 420000, 155, "medium", 159, 3),
  createTerritory("Heathrow", "Sanford", "Seminole", "community", 580000, 145, "high", 209, 2, true),
  createTerritory("Magnolia Plantation", "Sanford", "Seminole", "community", 450000, 125, "medium", 169, 3),
  
  // Lake Mary
  createTerritory("Lake Mary", "Orlando Metro", "Seminole", "city", 520000, 185, "high", 199, 1, true),
  createTerritory("Lake Mary Woods", "Lake Mary", "Seminole", "community", 480000, 135, "medium", 179, 3),
  createTerritory("Timacuan", "Lake Mary", "Seminole", "community", 550000, 125, "high", 199, 2),
  createTerritory("Markham Woods", "Lake Mary", "Seminole", "neighborhood", 680000, 115, "high", 239, 2),
  createTerritory("Colonial Town Park", "Lake Mary", "Seminole", "community", 450000, 145, "medium", 169, 3),
  
  // Longwood
  createTerritory("Longwood", "Orlando Metro", "Seminole", "city", 420000, 175, "medium", 159, 2),
  createTerritory("Historic Longwood", "Longwood", "Seminole", "neighborhood", 480000, 125, "medium", 179, 3),
  createTerritory("Wekiva Hunt Club", "Longwood", "Seminole", "community", 520000, 135, "high", 189, 3),
  createTerritory("Sabal Point", "Longwood", "Seminole", "community", 550000, 115, "high", 199, 3),
  createTerritory("Springs Landing", "Longwood", "Seminole", "community", 450000, 125, "medium", 169, 3),
  
  // Altamonte Springs
  createTerritory("Altamonte Springs", "Orlando Metro", "Seminole", "city", 400000, 185, "medium", 149, 2),
  createTerritory("Altamonte Mall Area", "Altamonte Springs", "Seminole", "neighborhood", 380000, 155, "medium", 139, 3),
  createTerritory("Spring Valley", "Altamonte Springs", "Seminole", "community", 420000, 135, "medium", 159, 3),
  createTerritory("Lake Orienta", "Altamonte Springs", "Seminole", "neighborhood", 450000, 125, "medium", 169, 3),
  createTerritory("Westmonte", "Altamonte Springs", "Seminole", "neighborhood", 350000, 145, "low", 119, 3),
  
  // Casselberry
  createTerritory("Casselberry", "Orlando Metro", "Seminole", "city", 360000, 165, "medium", 129, 3),
  createTerritory("Deer Run", "Casselberry", "Seminole", "community", 380000, 125, "medium", 139, 3),
  createTerritory("Carriage Cove", "Casselberry", "Seminole", "community", 340000, 115, "low", 119, 3),
  
  // Winter Springs
  createTerritory("Winter Springs", "Orlando Metro", "Seminole", "city", 420000, 175, "medium", 159, 2),
  createTerritory("Tuscawilla", "Winter Springs", "Seminole", "community", 480000, 145, "high", 179, 2),
  createTerritory("Tuskawilla", "Winter Springs", "Seminole", "neighborhood", 420000, 135, "medium", 159, 3),
  createTerritory("Moss Park", "Winter Springs", "Seminole", "community", 390000, 125, "medium", 139, 3),
  
  // Oviedo
  createTerritory("Oviedo", "Orlando Metro", "Seminole", "city", 450000, 185, "medium", 169, 2),
  createTerritory("Oviedo on the Park", "Oviedo", "Seminole", "community", 520000, 145, "high", 199, 2),
  createTerritory("Alafaya Woods", "Oviedo", "Seminole", "community", 420000, 135, "medium", 159, 3),
  createTerritory("Live Oak Reserve", "Oviedo", "Seminole", "community", 480000, 125, "medium", 179, 3),
  createTerritory("Carillon", "Oviedo", "Seminole", "community", 450000, 115, "medium", 169, 3),
  createTerritory("Black Hammock", "Oviedo", "Seminole", "neighborhood", 520000, 105, "medium", 189, 3),
  
  // Geneva & Chuluota
  createTerritory("Geneva", "Orlando Metro", "Seminole", "town", 480000, 115, "low", 159, 3),
  createTerritory("Chuluota", "Orlando Metro", "Seminole", "town", 420000, 125, "low", 149, 3),
  
  // ========================================
  // CENTRAL FLORIDA - OSCEOLA COUNTY
  // ========================================
  
  // Kissimmee
  createTerritory("Kissimmee", "Orlando Metro", "Osceola", "city", 380000, 245, "medium", 139, 2),
  createTerritory("Downtown Kissimmee", "Kissimmee", "Osceola", "neighborhood", 350000, 145, "medium", 129, 3),
  createTerritory("Kissimmee Lakefront", "Kissimmee", "Osceola", "neighborhood", 420000, 125, "medium", 159, 3),
  createTerritory("BVL (Buenaventura Lakes)", "Kissimmee", "Osceola", "community", 340000, 185, "low", 109, 3),
  createTerritory("Remington", "Kissimmee", "Osceola", "community", 380000, 155, "medium", 129, 3),
  createTerritory("Mill Run", "Kissimmee", "Osceola", "community", 350000, 145, "low", 119, 3),
  createTerritory("Poinciana", "Kissimmee", "Osceola", "community", 320000, 225, "low", 99, 3),
  createTerritory("Solivita", "Poinciana", "Osceola", "community", 380000, 155, "medium", 139, 3),
  createTerritory("Bellalago", "Kissimmee", "Osceola", "community", 420000, 145, "medium", 159, 3),
  createTerritory("Pleasant Hill", "Kissimmee", "Osceola", "neighborhood", 310000, 135, "low", 99, 3),
  createTerritory("Campbell", "Kissimmee", "Osceola", "neighborhood", 340000, 125, "low", 109, 3),
  
  // St. Cloud
  createTerritory("St. Cloud", "Orlando Metro", "Osceola", "city", 380000, 195, "medium", 139, 2),
  createTerritory("Downtown St. Cloud", "St. Cloud", "Osceola", "neighborhood", 350000, 125, "medium", 129, 3),
  createTerritory("Lakefront", "St. Cloud", "Osceola", "neighborhood", 420000, 115, "medium", 159, 3),
  createTerritory("Harmony", "St. Cloud", "Osceola", "community", 380000, 175, "medium", 139, 2),
  createTerritory("Narcoossee Corridor", "St. Cloud", "Osceola", "neighborhood", 450000, 165, "medium", 169, 3),
  createTerritory("Stevens Plantation", "St. Cloud", "Osceola", "community", 350000, 135, "low", 119, 3),
  createTerritory("Canoe Creek", "St. Cloud", "Osceola", "community", 380000, 125, "medium", 129, 3),
  createTerritory("Tohoqua", "St. Cloud", "Osceola", "community", 420000, 145, "medium", 159, 3),
  createTerritory("Hickory Tree", "St. Cloud", "Osceola", "community", 360000, 115, "low", 119, 3),
  
  // Celebration
  createTerritory("Celebration", "Orlando Metro", "Osceola", "town", 620000, 145, "high", 229, 1, true),
  createTerritory("Celebration Village", "Celebration", "Osceola", "neighborhood", 750000, 95, "high", 269, 2),
  createTerritory("Celebration North Village", "Celebration", "Osceola", "neighborhood", 580000, 85, "high", 219, 3),
  createTerritory("Celebration South Village", "Celebration", "Osceola", "neighborhood", 550000, 95, "high", 199, 3),
  
  // Reunion & ChampionsGate
  createTerritory("Reunion", "Orlando Metro", "Osceola", "community", 580000, 135, "high", 209, 2),
  createTerritory("ChampionsGate", "Orlando Metro", "Osceola", "community", 520000, 155, "high", 189, 2),
  createTerritory("Encore at Reunion", "Reunion", "Osceola", "community", 450000, 115, "medium", 169, 3),
  
  // ========================================
  // CENTRAL FLORIDA - LAKE COUNTY
  // ========================================
  
  // Clermont
  createTerritory("Clermont", "Orlando Metro", "Lake", "city", 450000, 225, "high", 169, 1, true),
  createTerritory("Downtown Clermont", "Clermont", "Lake", "neighborhood", 480000, 145, "medium", 179, 2),
  createTerritory("Legends", "Clermont", "Lake", "community", 520000, 155, "high", 189, 2),
  createTerritory("Palms of Serenoa", "Clermont", "Lake", "community", 450000, 135, "medium", 169, 3),
  createTerritory("Hartwood Reserve", "Clermont", "Lake", "community", 480000, 125, "medium", 179, 3),
  createTerritory("Kings Ridge", "Clermont", "Lake", "community", 380000, 145, "medium", 139, 3),
  createTerritory("Minneola", "Clermont", "Lake", "town", 420000, 165, "medium", 159, 3),
  createTerritory("Montverde", "Clermont", "Lake", "town", 580000, 125, "high", 209, 3),
  createTerritory("Groves at Clermont", "Clermont", "Lake", "community", 450000, 135, "medium", 169, 3),
  createTerritory("Olympia", "Clermont", "Lake", "community", 520000, 155, "high", 189, 2),
  createTerritory("Sawgrass Bay", "Clermont", "Lake", "community", 420000, 145, "medium", 159, 3),
  
  // Groveland & Mascotte
  createTerritory("Groveland", "Orlando Metro", "Lake", "city", 380000, 185, "medium", 139, 2),
  createTerritory("South Lake", "Groveland", "Lake", "neighborhood", 420000, 145, "medium", 159, 3),
  createTerritory("Trilogy at Ocala Preserve", "Groveland", "Lake", "community", 380000, 125, "medium", 139, 3),
  createTerritory("Mascotte", "Orlando Metro", "Lake", "city", 340000, 155, "low", 119, 3),
  
  // Leesburg
  createTerritory("Leesburg", "Orlando Metro", "Lake", "city", 350000, 185, "medium", 129, 2),
  createTerritory("Downtown Leesburg", "Leesburg", "Lake", "neighborhood", 380000, 125, "medium", 139, 3),
  createTerritory("Lake Harris", "Leesburg", "Lake", "neighborhood", 450000, 115, "medium", 169, 3),
  createTerritory("Royal Highlands", "Leesburg", "Lake", "community", 320000, 145, "low", 109, 3),
  createTerritory("Plantation at Leesburg", "Leesburg", "Lake", "community", 350000, 135, "medium", 119, 3),
  
  // Mount Dora
  createTerritory("Mount Dora", "Orlando Metro", "Lake", "city", 420000, 175, "high", 169, 2, true),
  createTerritory("Downtown Mount Dora", "Mount Dora", "Lake", "neighborhood", 520000, 125, "high", 199, 2),
  createTerritory("Wolf Branch", "Mount Dora", "Lake", "community", 450000, 135, "medium", 169, 3),
  createTerritory("Lake Jem", "Mount Dora", "Lake", "neighborhood", 380000, 115, "medium", 139, 3),
  
  // Tavares & Eustis
  createTerritory("Tavares", "Orlando Metro", "Lake", "city", 350000, 165, "medium", 129, 3),
  createTerritory("Seaplane City", "Tavares", "Lake", "neighborhood", 380000, 115, "medium", 139, 3),
  createTerritory("Eustis", "Orlando Metro", "Lake", "city", 340000, 155, "medium", 119, 3),
  createTerritory("Downtown Eustis", "Eustis", "Lake", "neighborhood", 380000, 105, "medium", 139, 3),
  createTerritory("Umatilla", "Orlando Metro", "Lake", "town", 320000, 125, "low", 109, 3),
  
  // Other Lake County
  createTerritory("Lady Lake", "Orlando Metro", "Lake", "town", 340000, 165, "medium", 119, 3),
  createTerritory("The Villages (Lake)", "Lady Lake", "Lake", "community", 380000, 245, "high", 149, 1),
  createTerritory("Fruitland Park", "Orlando Metro", "Lake", "city", 320000, 135, "low", 109, 3),
  createTerritory("Howey-in-the-Hills", "Orlando Metro", "Lake", "town", 420000, 95, "medium", 159, 3),
  createTerritory("Astatula", "Orlando Metro", "Lake", "town", 320000, 105, "low", 99, 3),
  createTerritory("Sorrento", "Orlando Metro", "Lake", "town", 420000, 115, "medium", 159, 3),
  
  // ========================================
  // CENTRAL FLORIDA - VOLUSIA COUNTY
  // ========================================
  
  // Deltona
  createTerritory("Deltona", "Orlando Metro", "Volusia", "city", 350000, 195, "medium", 129, 2),
  createTerritory("Deltona Lakes", "Deltona", "Volusia", "neighborhood", 320000, 145, "low", 109, 3),
  createTerritory("Deltona Gardens", "Deltona", "Volusia", "neighborhood", 340000, 135, "low", 119, 3),
  createTerritory("Orange City", "Orlando Metro", "Volusia", "city", 360000, 175, "medium", 129, 3),
  createTerritory("Debary", "Orlando Metro", "Volusia", "city", 380000, 165, "medium", 139, 2),
  createTerritory("River Oaks", "Debary", "Volusia", "community", 420000, 125, "medium", 159, 3),
  
  // Daytona Beach Area
  createTerritory("Daytona Beach", "Daytona Metro", "Volusia", "city", 350000, 195, "medium", 139, 2),
  createTerritory("Daytona Beach Shores", "Daytona Beach", "Volusia", "city", 450000, 145, "high", 179, 2),
  createTerritory("Port Orange", "Daytona Metro", "Volusia", "city", 380000, 185, "medium", 149, 2),
  createTerritory("Ormond Beach", "Daytona Metro", "Volusia", "city", 420000, 175, "medium", 159, 2),
  createTerritory("Ormond-by-the-Sea", "Ormond Beach", "Volusia", "neighborhood", 520000, 125, "high", 189, 3),
  createTerritory("Holly Hill", "Daytona Metro", "Volusia", "city", 320000, 145, "low", 109, 3),
  createTerritory("South Daytona", "Daytona Metro", "Volusia", "city", 340000, 155, "low", 119, 3),
  
  // New Smyrna Beach Area
  createTerritory("New Smyrna Beach", "Daytona Metro", "Volusia", "city", 480000, 165, "high", 179, 2),
  createTerritory("Edgewater", "Daytona Metro", "Volusia", "city", 350000, 155, "medium", 129, 3),
  createTerritory("Oak Hill", "Daytona Metro", "Volusia", "town", 340000, 115, "low", 119, 3),
  
  // West Volusia
  createTerritory("DeLand", "Orlando Metro", "Volusia", "city", 380000, 175, "medium", 139, 2),
  createTerritory("Downtown DeLand", "DeLand", "Volusia", "neighborhood", 450000, 125, "high", 169, 2),
  createTerritory("Victoria Park", "DeLand", "Volusia", "community", 420000, 115, "medium", 159, 3),
  createTerritory("Lake Helen", "DeLand", "Volusia", "town", 380000, 105, "medium", 139, 3),
  
  // ========================================
  // CENTRAL FLORIDA - POLK COUNTY
  // ========================================
  
  // Lakeland
  createTerritory("Lakeland", "Tampa Metro", "Polk", "city", 380000, 225, "medium", 149, 1),
  createTerritory("Downtown Lakeland", "Lakeland", "Polk", "neighborhood", 420000, 145, "medium", 169, 2),
  createTerritory("South Lakeland", "Lakeland", "Polk", "neighborhood", 350000, 155, "medium", 129, 3),
  createTerritory("North Lakeland", "Lakeland", "Polk", "neighborhood", 380000, 165, "medium", 139, 3),
  createTerritory("Grasslands", "Lakeland", "Polk", "community", 450000, 135, "medium", 169, 3),
  createTerritory("Lake Hollingsworth", "Lakeland", "Polk", "neighborhood", 520000, 115, "high", 189, 2),
  createTerritory("Lake Morton", "Lakeland", "Polk", "neighborhood", 480000, 105, "high", 179, 3),
  createTerritory("Highland City", "Lakeland", "Polk", "neighborhood", 340000, 145, "low", 119, 3),
  
  // Winter Haven
  createTerritory("Winter Haven", "Tampa Metro", "Polk", "city", 350000, 195, "medium", 139, 2),
  createTerritory("Downtown Winter Haven", "Winter Haven", "Polk", "neighborhood", 380000, 125, "medium", 149, 3),
  createTerritory("Lake Region", "Winter Haven", "Polk", "neighborhood", 420000, 135, "medium", 159, 3),
  createTerritory("LEGOLAND Area", "Winter Haven", "Polk", "neighborhood", 350000, 145, "medium", 129, 3),
  createTerritory("Eagle Lake", "Winter Haven", "Polk", "town", 320000, 115, "low", 109, 3),
  
  // Other Polk County
  createTerritory("Auburndale", "Tampa Metro", "Polk", "city", 340000, 175, "medium", 119, 3),
  createTerritory("Davenport", "Orlando Metro", "Polk", "city", 380000, 215, "medium", 139, 2),
  createTerritory("Four Corners", "Orlando Metro", "Polk", "community", 420000, 185, "medium", 159, 3),
  createTerritory("Haines City", "Orlando Metro", "Polk", "city", 340000, 175, "low", 119, 3),
  createTerritory("Dundee", "Haines City", "Polk", "town", 310000, 125, "low", 99, 3),
  createTerritory("Lake Wales", "Tampa Metro", "Polk", "city", 320000, 155, "low", 109, 3),
  createTerritory("Bartow", "Tampa Metro", "Polk", "city", 310000, 165, "low", 99, 3),
  createTerritory("Mulberry", "Tampa Metro", "Polk", "city", 290000, 145, "low", 90, 3),
  createTerritory("Fort Meade", "Tampa Metro", "Polk", "city", 280000, 115, "low", 90, 3),
  createTerritory("Frostproof", "Tampa Metro", "Polk", "city", 260000, 95, "low", 90, 3),
  createTerritory("Lake Alfred", "Tampa Metro", "Polk", "city", 320000, 135, "low", 109, 3),
  createTerritory("Polk City", "Tampa Metro", "Polk", "town", 380000, 125, "medium", 139, 3),
  
  // ========================================
  // CENTRAL FLORIDA - BREVARD COUNTY (Space Coast)
  // ========================================
  
  createTerritory("Melbourne", "Space Coast", "Brevard", "city", 420000, 195, "medium", 159, 2),
  createTerritory("Downtown Melbourne", "Melbourne", "Brevard", "neighborhood", 480000, 145, "high", 179, 2),
  createTerritory("Viera", "Melbourne", "Brevard", "community", 520000, 175, "high", 199, 1, true),
  createTerritory("Suntree", "Melbourne", "Brevard", "community", 480000, 145, "medium", 179, 3),
  createTerritory("West Melbourne", "Melbourne", "Brevard", "city", 380000, 175, "medium", 139, 3),
  createTerritory("Palm Bay", "Space Coast", "Brevard", "city", 350000, 215, "medium", 119, 2),
  createTerritory("Malabar", "Space Coast", "Brevard", "town", 480000, 115, "medium", 179, 3),
  createTerritory("Cocoa", "Space Coast", "Brevard", "city", 340000, 165, "low", 119, 3),
  createTerritory("Cocoa Beach", "Space Coast", "Brevard", "city", 520000, 155, "high", 199, 2),
  createTerritory("Cape Canaveral", "Space Coast", "Brevard", "city", 450000, 145, "medium", 169, 3),
  createTerritory("Merritt Island", "Space Coast", "Brevard", "city", 450000, 175, "medium", 169, 2),
  createTerritory("Titusville", "Space Coast", "Brevard", "city", 350000, 165, "medium", 129, 3),
  createTerritory("Rockledge", "Space Coast", "Brevard", "city", 380000, 175, "medium", 139, 3),
  createTerritory("Satellite Beach", "Space Coast", "Brevard", "city", 520000, 145, "high", 189, 3),
  createTerritory("Indian Harbour Beach", "Space Coast", "Brevard", "city", 580000, 125, "high", 209, 3),
  createTerritory("Indialantic", "Space Coast", "Brevard", "town", 620000, 115, "high", 229, 2),
  createTerritory("Melbourne Beach", "Space Coast", "Brevard", "town", 720000, 105, "high", 259, 2),
]

const VA_PACKAGES: VAPackage[] = [
  {
    id: "va-20hrs",
    name: "Part-Time",
    hours: 20,
    price: 149,
    hourlyRate: 7.25,
    features: ["Lead follow-ups", "Email management", "Calendar scheduling", "Basic data entry"],
    popular: false,
  },
  {
    id: "va-40hrs",
    name: "Full-Time",
    hours: 40,
    price: 299,
    hourlyRate: 7.25,
    features: ["Lead qualification", "Transaction support", "CRM management", "Team coordination", "Unlimited support"],
    popular: true,
  },
]

const PHYSICAL_PRODUCTS: PhysicalProduct[] = [
  {
    id: "sign-24x36",
    name: "Yard Signs",
    category: "signs",
    description: "Professional real estate yard signs",
    price: 12,
    quantity: "per sign",
    features: ["Full color printing", "Weather resistant", "Standard design included", "Free shipping (50+)"],
    popular: true,
    customFields: ["agentName", "phone", "brokerage", "colorScheme", "logo"],
    image: "/images/products/yard-signs.jpg",
  },
  {
    id: "cards-500",
    name: "Business Cards",
    category: "cards",
    description: "Premium business cards",
    price: 25,
    quantity: "per 500",
    features: ["Glossy or matte", "Custom design", "Quick turnaround", "Free design consultation"],
    popular: true,
    customFields: ["agentName", "phone", "email", "brokerage", "tagline", "colorScheme", "logo"],
    image: "/images/products/business-cards.jpg",
  },
  {
    id: "flyers-500",
    name: "Property Flyers",
    category: "flyers",
    description: "Full-color property listing flyers",
    price: 35,
    quantity: "per 500",
    features: ["High-quality print", "MLS integration ready", "Multiple templates", "Digital version included"],
    customFields: ["agentName", "phone", "email", "brokerage", "colorScheme", "logo"],
    image: "/images/products/property-flyers.jpg",
  },
  {
    id: "postcards-500",
    name: "Direct Mail Postcards",
    category: "postcards",
    description: "Targeted direct mail postcards",
    price: 45,
    quantity: "per 500",
    features: ["Full color", "Personalized options", "Address printing", "Postage assistance"],
    customFields: ["agentName", "phone", "email", "brokerage", "tagline", "colorScheme", "logo"],
    image: "/images/products/postcards.jpg",
  },
  {
    id: "banners-vinyl",
    name: "Vinyl Banners",
    category: "banners",
    description: "Large format vinyl banners",
    price: 55,
    quantity: "per 10x3ft",
    features: ["Custom design", "Weather-proof", "Free design", "Installation hardware included"],
    customFields: ["agentName", "phone", "brokerage", "tagline", "colorScheme", "logo"],
    image: "/images/products/vinyl-banners.jpg",
  },
  {
    id: "door-hangers",
    name: "Door Hangers",
    category: "hangers",
    description: "Durable door hangers for prospecting",
    price: 30,
    quantity: "per 500",
    features: ["Full color", "Die-cut design", "Tear-off contact card", "Recyclable material"],
    customFields: ["agentName", "phone", "email", "tagline", "colorScheme"],
    image: "/images/products/door-hangers.jpg",
  },
]

const COLOR_SCHEMES = [
  { id: "navy-gold", name: "Navy & Gold", primary: "#1e3a5f", secondary: "#d4af37" },
  { id: "black-red", name: "Black & Red", primary: "#1a1a1a", secondary: "#dc2626" },
  { id: "green-white", name: "Forest Green", primary: "#166534", secondary: "#ffffff" },
  { id: "blue-white", name: "Ocean Blue", primary: "#1d4ed8", secondary: "#ffffff" },
  { id: "burgundy-cream", name: "Burgundy & Cream", primary: "#7c2d12", secondary: "#fef3c7" },
  { id: "teal-coral", name: "Teal & Coral", primary: "#0d9488", secondary: "#fb7185" },
]

export function MarketingMarketplace() {
  const [activeTab, setActiveTab] = useState("physical")
  const [selectedTerritory, setSelectedTerritory] = useState<TerritoryListing | null>(null)
  const [selectedVA, setSelectedVA] = useState<VAPackage | null>(null)
  const [selectedProduct, setSelectedProduct] = useState<PhysicalProduct | null>(null)
  const [customizeProduct, setCustomizeProduct] = useState<PhysicalProduct | null>(null)
  const [cart, setCart] = useState<(TerritoryListing | VAPackage | PhysicalProduct)[]>([])
  const [activeMarket, setActiveMarket] = useState<"all" | "high" | "medium" | "low">("all")
  const [territorySearch, setTerritorySearch] = useState("")
  const [customization, setCustomization] = useState<ProductCustomization>({
    agentName: "",
    phone: "",
    email: "",
    brokerage: "",
    tagline: "",
    colorScheme: "navy-gold",
    logoUrl: "",
    quantity: 1,
  })
  const { toast } = useToast()

  const filteredTerritories = TERRITORY_LISTINGS.filter((t) => {
    const matchesMarket = activeMarket === "all" || t.marketDemand === activeMarket
    const matchesSearch = territorySearch === "" || 
      t.city.toLowerCase().includes(territorySearch.toLowerCase()) ||
      t.region.toLowerCase().includes(territorySearch.toLowerCase()) ||
      t.county.toLowerCase().includes(territorySearch.toLowerCase())
    return matchesMarket && matchesSearch
  })

  const cartTotal = cart.reduce((sum, item) => sum + (item as any).price, 0)

  const handleAddToCart = (item: any, type: string) => {
    setCart([...cart, item])
    const name = item.name || item.city || "Item"
    toast({
      title: "Added to cart",
      description: `${name} has been added`,
    })
  }

  const getDemandColor = (demand: string) => {
    switch (demand) {
      case "high":
        return "bg-emerald-500/20 text-emerald-300 border-emerald-500/30"
      case "medium":
        return "bg-amber-500/20 text-amber-300 border-amber-500/30"
      default:
        return "bg-blue-500/20 text-blue-300 border-blue-500/30"
    }
  }

  return (
    <div className="space-y-8">
      {/* Hero Section */}
      <div className="bg-gradient-to-br from-primary/20 via-purple-500/10 to-pink-500/10 rounded-2xl p-8 border border-primary/20">
        <div className="max-w-3xl">
          <h1 className="text-4xl font-bold mb-3 text-white">Marketing Hub</h1>
          <p className="text-lg text-slate-300 mb-4">
            Scale your business with territories, virtual assistants, and professional marketing materials
          </p>
          <div className="flex items-center gap-2 text-sm text-primary">
            <Zap className="h-4 w-4" />
            <span>Everything you need to grow your real estate business</span>
          </div>
        </div>
      </div>

      {/* Main Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3 bg-white/5 border border-white/10">
          <TabsTrigger value="physical">Marketing Materials</TabsTrigger>
          <TabsTrigger value="va">Virtual Assistants</TabsTrigger>
          <TabsTrigger value="territories">Buy Territory</TabsTrigger>
        </TabsList>

{/* TERRITORIES TAB */}
  <TabsContent value="territories" className="space-y-6 mt-8">
  <div className="flex flex-col md:flex-row gap-4 justify-between">
  <div>
    <h2 className="text-2xl font-bold text-white">Exclusive Territories</h2>
    <p className="text-slate-400 text-sm mt-1">{filteredTerritories.length} areas available across Florida</p>
  </div>
  <div className="relative w-full md:w-80">
    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
    <Input
      placeholder="Search by city, town, or neighborhood..."
      value={territorySearch}
      onChange={(e) => setTerritorySearch(e.target.value)}
      className="pl-10 bg-white/5 border-white/10"
    />
  </div>
  </div>
  
  <div className="flex flex-wrap gap-2 items-center">
  <span className="text-sm text-slate-400">Filter by demand:</span>
  <div className="flex gap-2">
    <Button 
      variant={activeMarket === "all" ? "default" : "outline"} 
      size="sm"
      onClick={() => setActiveMarket("all")}
    >
      All ({TERRITORY_LISTINGS.length})
    </Button>
    <Button 
      variant={activeMarket === "high" ? "default" : "outline"} 
      size="sm"
      onClick={() => setActiveMarket("high")}
      className={activeMarket !== "high" ? "border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10" : ""}
    >
      High Demand
    </Button>
    <Button 
      variant={activeMarket === "medium" ? "default" : "outline"} 
      size="sm"
      onClick={() => setActiveMarket("medium")}
      className={activeMarket !== "medium" ? "border-amber-500/30 text-amber-400 hover:bg-amber-500/10" : ""}
    >
      Medium
    </Button>
    <Button 
      variant={activeMarket === "low" ? "default" : "outline"} 
      size="sm"
      onClick={() => setActiveMarket("low")}
      className={activeMarket !== "low" ? "border-blue-500/30 text-blue-400 hover:bg-blue-500/10" : ""}
    >
      Low
    </Button>
  </div>
  </div>

  {filteredTerritories.length === 0 && territorySearch ? (
          <Card className="p-6 bg-white/5 border-red-500/30">
            <div className="flex items-start gap-4">
              <div className="relative h-32 w-32 rounded-lg overflow-hidden flex-shrink-0 bg-gradient-to-br from-red-500/20 to-red-900/20 flex items-center justify-center">
                <MapPin className="h-12 w-12 text-red-400" />
              </div>
              <div className="flex-1">
                <Badge className="bg-red-500/20 text-red-400 border-red-500/30 mb-2">Territory Claimed</Badge>
                <h3 className="text-xl font-bold text-white mb-1">{territorySearch}</h3>
                <p className="text-slate-400 text-sm mb-4">
                  This area has already been claimed by another agent. All 3 spots are currently filled.
                </p>
                <div className="flex items-center gap-2 mb-4">
                  <span className="text-slate-400 text-sm">Availability:</span>
                  <div className="flex items-center gap-1.5">
                    {[0, 1, 2].map((i) => (
                      <div key={i} className="w-2.5 h-2.5 rounded-full bg-slate-600" />
                    ))}
                    <span className="ml-1 font-semibold text-red-400">0/3</span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => { setTerritorySearch(""); setActiveMarket("all"); }}>
                    Browse Available Areas
                  </Button>
                  <Button variant="outline" size="sm" className="border-primary/30 text-primary hover:bg-primary/10">
                    Join Waitlist
                  </Button>
                </div>
              </div>
            </div>
          </Card>
        ) : filteredTerritories.length === 0 ? (
          <div className="text-center py-12">
            <MapPin className="h-12 w-12 mx-auto text-slate-500 mb-4" />
            <h3 className="text-lg font-semibold text-white mb-2">No areas found</h3>
            <p className="text-slate-400">Try adjusting your search or filter criteria</p>
            <Button variant="outline" className="mt-4" onClick={() => { setTerritorySearch(""); setActiveMarket("all"); }}>
              Clear Filters
            </Button>
          </div>
        ) : (
  <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {filteredTerritories.map((territory) => (
                  <Card
                    key={territory.id}
                    className={`group relative overflow-hidden transition-all duration-300 hover:scale-105 flex flex-col ${
                      territory.popular ? "ring-2 ring-primary/50 shadow-lg shadow-primary/20" : ""
                    }`}
                  >
                    {/* Image */}
                    <div className="relative h-40 overflow-hidden">
                      <img 
                        src={territory.image} 
                        alt={`${territory.city}, ${territory.state}`}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                      
                      {territory.popular && (
                        <Badge className="absolute top-3 right-3 bg-primary text-white z-10">Premium</Badge>
                      )}

                      <Badge
                        variant="outline"
                        className={`absolute top-3 left-3 z-10 border ${getDemandColor(territory.marketDemand)}`}
                      >
                        {territory.marketDemand === "high" && <TrendingUp className="h-3 w-3 mr-1" />}
                        {territory.marketDemand.charAt(0).toUpperCase() + territory.marketDemand.slice(1)}
                      </Badge>

                      <div className="absolute bottom-3 left-4">
                        <Badge variant="outline" className="border-white/30 text-white/80 text-xs capitalize">
                          {territory.type}
                        </Badge>
                      </div>
                    </div>

                    <div className="relative flex-1 p-5 space-y-4 flex flex-col">
                      <div className="space-y-0.5">
                        <p className="text-lg font-semibold text-primary leading-tight">{territory.city}</p>
                        <p className="text-xs text-slate-400">{territory.county} County &middot; {territory.state}</p>
                      </div>

<div className="space-y-2 bg-white/5 rounded-lg p-3">
  <div className="flex justify-between items-center text-sm">
  <span className="text-slate-400">Avg Home Price</span>
  <span className="text-white font-semibold">
    {territory.avgHomePrice >= 1000000
      ? `$${(territory.avgHomePrice / 1000000).toFixed(1)}M`
      : `$${(territory.avgHomePrice / 1000).toFixed(0)}K`}
  </span>
  </div>
  <div className="flex justify-between items-center text-sm">
  <span className="text-slate-400">Leads/Month</span>
  <span className="text-primary font-semibold">{territory.monthlyLeads}+</span>
  </div>
  <div className="flex justify-between items-center text-sm pt-2 border-t border-white/10">
  <span className="text-slate-400">Spots Available</span>
  <div className="flex items-center gap-1.5">
    {[...Array(territory.totalSpots)].map((_, i) => (
      <div 
        key={i} 
        className={`w-2.5 h-2.5 rounded-full ${i < territory.spotsAvailable ? 'bg-emerald-500' : 'bg-slate-600'}`}
      />
    ))}
    <span className={`ml-1 font-semibold ${territory.spotsAvailable === 0 ? 'text-red-400' : territory.spotsAvailable === 1 ? 'text-amber-400' : 'text-emerald-400'}`}>
      {territory.spotsAvailable}/{territory.totalSpots}
    </span>
  </div>
  </div>
  </div>

                      <div className="space-y-3 mt-auto pt-3 border-t border-white/10">
                        <div className="flex items-baseline gap-1">
                          <span className="text-2xl font-bold text-white">${territory.price}</span>
                          <span className="text-sm text-slate-400">/mo</span>
                        </div>
                        {territory.spotsAvailable === 0 ? (
                          <Button className="w-full" variant="outline" disabled>
                            Sold Out
                          </Button>
                        ) : (
                          <Button
                            className="w-full"
                            onClick={() => {
                              handleAddToCart(territory, "territory")
                              setSelectedTerritory(territory)
                            }}
                          >
                            <ShoppingCart className="h-4 w-4 mr-2" />
                            {territory.spotsAvailable === 1 ? "Last Spot!" : "Claim Territory"}
                          </Button>
                        )}
                      </div>
                    </div>
                  </Card>
                ))}
          </div>
        )}
        </TabsContent>

        {/* VA TAB */}
        <TabsContent value="va" className="space-y-8 mt-8">
          <div>
            <h2 className="text-2xl font-bold text-white mb-2">Virtual Assistants</h2>
            <p className="text-slate-400">Hire dedicated VAs at $7.25/hour - choose your hours</p>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            {VA_PACKAGES.map((pkg) => (
              <Card
                key={pkg.id}
                className={`group relative overflow-hidden transition-all duration-300 hover:scale-105 flex flex-col ${
                  pkg.popular ? "ring-2 ring-primary/50 shadow-lg shadow-primary/20" : ""
                }`}
              >
                {/* VA Image */}
                <div className="relative h-44 overflow-hidden">
                  <img
                    src="/images/products/va-assistant.jpg"
                    alt="Virtual Assistant"
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                  {pkg.popular && (
                    <Badge className="absolute top-3 right-3 bg-primary text-white z-10">Popular</Badge>
                  )}
                  <div className="absolute bottom-3 left-4">
                    <p className="text-lg font-bold text-white drop-shadow">{pkg.name}</p>
                    <p className="text-sm text-white/70">{pkg.hours} hours/month</p>
                  </div>
                </div>

                <div className="relative flex-1 p-5 space-y-4 flex flex-col">
                  <div className="space-y-3 bg-white/5 rounded-lg p-3">
                    {pkg.features.map((feature, i) => (
                      <div key={i} className="flex items-start gap-2 text-sm">
                        <Check className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
                        <span className="text-slate-300">{feature}</span>
                      </div>
                    ))}
                  </div>

                  <div className="space-y-3 mt-auto pt-4 border-t border-white/10">
                    <div>
                      <div className="text-3xl font-bold text-white">${pkg.price}</div>
                      <p className="text-sm text-slate-400">${pkg.hourlyRate}/hr &middot; {pkg.hours} hrs/mo</p>
                    </div>
                    <Button
                      className="w-full"
                      onClick={() => {
                        handleAddToCart(pkg, "va")
                        setSelectedVA(pkg)
                      }}
                    >
                      <ShoppingCart className="h-4 w-4 mr-2" />
                      Add to Cart
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* PHYSICAL MATERIALS TAB */}
        <TabsContent value="physical" className="space-y-8 mt-8">
          <div>
            <h2 className="text-2xl font-bold text-white mb-2">Physical Marketing Materials</h2>
            <p className="text-slate-400">Professional signs, cards, flyers, and more</p>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {PHYSICAL_PRODUCTS.map((product) => (
              <Card
                key={product.id}
                className={`group relative overflow-hidden transition-all duration-300 hover:scale-105 flex flex-col ${
                  product.popular ? "ring-2 ring-primary/50 shadow-lg shadow-primary/20" : ""
                }`}
              >
                {/* Product Image */}
                <div className="relative h-44 overflow-hidden">
                  <img
                    src={product.image}
                    alt={product.name}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                  {product.popular && (
                    <Badge className="absolute top-3 right-3 bg-primary text-white z-10">Popular</Badge>
                  )}
                  <Badge variant="outline" className="absolute top-3 left-3 bg-black/50 backdrop-blur-sm border-white/20 text-white z-10 capitalize">
                    {product.category}
                  </Badge>
                  <div className="absolute bottom-3 left-4">
                    <p className="text-lg font-bold text-white drop-shadow">{product.name}</p>
                  </div>
                </div>

                <div className="relative flex-1 p-5 space-y-4 flex flex-col">
                  <p className="text-sm text-slate-400">{product.description}</p>

                  <div className="space-y-2 bg-white/5 rounded-lg p-3">
                    {product.features.map((feature, i) => (
                      <div key={i} className="flex items-start gap-2 text-sm">
                        <Check className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
                        <span className="text-slate-300">{feature}</span>
                      </div>
                    ))}
                  </div>

                  <div className="space-y-3 mt-auto pt-4 border-t border-white/10">
                    <div>
                      <div className="text-3xl font-bold text-white">${product.price}</div>
                      <p className="text-sm text-slate-400">{product.quantity}</p>
                    </div>
                    <Button
                      className="w-full"
                      onClick={() => setCustomizeProduct(product)}
                    >
                      <Palette className="h-4 w-4 mr-2" />
                      Customize & Order
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>

      {/* Cart Summary */}
      {cart.length > 0 && (
        <Card className="sticky bottom-0 bg-gradient-to-r from-primary/20 to-purple-500/20 border-primary/30 p-6">
          <div className="flex items-center justify-between gap-4">
            <div className="space-y-1">
              <p className="text-sm text-slate-300">
                {cart.length} item{cart.length !== 1 ? "s" : ""} in cart
              </p>
              <p className="text-2xl font-bold text-white">
                ${cartTotal}
                <span className="text-lg text-slate-400 font-normal">/month</span>
              </p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setCart([])}>
                Clear
              </Button>
              <Button className="gap-2">
                Checkout
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* Product Customization Dialog */}
      <Dialog open={!!customizeProduct} onOpenChange={() => setCustomizeProduct(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Palette className="h-5 w-5 text-primary" />
              Customize Your {customizeProduct?.name}
            </DialogTitle>
            <DialogDescription>
              Personalize your marketing materials with your branding
            </DialogDescription>
          </DialogHeader>

          {customizeProduct && (
            <div className="grid md:grid-cols-2 gap-6 mt-4">
              {/* Customization Form */}
              <div className="space-y-5">
                <div className="space-y-4">
                  <h3 className="font-semibold text-white flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center text-xs text-primary">1</span>
                    Your Information
                  </h3>
                  
                  {customizeProduct.customFields.includes("agentName") && (
                    <div className="space-y-2">
                      <Label htmlFor="agentName">Agent Name</Label>
                      <Input
                        id="agentName"
                        placeholder="John Smith"
                        value={customization.agentName}
                        onChange={(e) => setCustomization({ ...customization, agentName: e.target.value })}
                      />
                    </div>
                  )}

                  {customizeProduct.customFields.includes("phone") && (
                    <div className="space-y-2">
                      <Label htmlFor="phone">Phone Number</Label>
                      <Input
                        id="phone"
                        placeholder="(555) 123-4567"
                        value={customization.phone}
                        onChange={(e) => setCustomization({ ...customization, phone: e.target.value })}
                      />
                    </div>
                  )}

                  {customizeProduct.customFields.includes("email") && (
                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        type="email"
                        placeholder="john@realestate.com"
                        value={customization.email}
                        onChange={(e) => setCustomization({ ...customization, email: e.target.value })}
                      />
                    </div>
                  )}

                  {customizeProduct.customFields.includes("brokerage") && (
                    <div className="space-y-2">
                      <Label htmlFor="brokerage">Brokerage Name</Label>
                      <Input
                        id="brokerage"
                        placeholder="Premier Realty Group"
                        value={customization.brokerage}
                        onChange={(e) => setCustomization({ ...customization, brokerage: e.target.value })}
                      />
                    </div>
                  )}

                  {customizeProduct.customFields.includes("tagline") && (
                    <div className="space-y-2">
                      <Label htmlFor="tagline">Tagline / Slogan</Label>
                      <Textarea
                        id="tagline"
                        placeholder="Your dream home awaits..."
                        value={customization.tagline}
                        onChange={(e) => setCustomization({ ...customization, tagline: e.target.value })}
                        className="resize-none h-20"
                      />
                    </div>
                  )}
                </div>

                <div className="space-y-4">
                  <h3 className="font-semibold text-white flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center text-xs text-primary">2</span>
                    Branding
                  </h3>

                  {customizeProduct.customFields.includes("colorScheme") && (
                    <div className="space-y-2">
                      <Label>Color Scheme</Label>
                      <div className="grid grid-cols-3 gap-2">
                        {COLOR_SCHEMES.map((scheme) => (
                          <button
                            key={scheme.id}
                            onClick={() => setCustomization({ ...customization, colorScheme: scheme.id })}
                            className={`p-3 rounded-lg border transition-all ${
                              customization.colorScheme === scheme.id
                                ? "border-primary ring-2 ring-primary/50"
                                : "border-white/10 hover:border-white/30"
                            }`}
                          >
                            <div className="flex gap-1 mb-2">
                              <div
                                className="w-6 h-6 rounded"
                                style={{ backgroundColor: scheme.primary }}
                              />
                              <div
                                className="w-6 h-6 rounded border border-white/20"
                                style={{ backgroundColor: scheme.secondary }}
                              />
                            </div>
                            <p className="text-xs text-slate-300">{scheme.name}</p>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {customizeProduct.customFields.includes("logo") && (
                    <div className="space-y-2">
                      <Label>Upload Logo</Label>
                      <div className="border-2 border-dashed border-white/20 rounded-lg p-6 text-center hover:border-primary/50 transition-colors cursor-pointer">
                        <Upload className="h-8 w-8 mx-auto text-slate-400 mb-2" />
                        <p className="text-sm text-slate-400">Click to upload or drag and drop</p>
                        <p className="text-xs text-slate-500 mt-1">PNG, JPG up to 5MB</p>
                      </div>
                    </div>
                  )}
                </div>

                <div className="space-y-4">
                  <h3 className="font-semibold text-white flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center text-xs text-primary">3</span>
                    Quantity
                  </h3>
                  <div className="flex items-center gap-4">
                    <Select
                      value={String(customization.quantity)}
                      onValueChange={(v) => setCustomization({ ...customization, quantity: Number(v) })}
                    >
                      <SelectTrigger className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1">1</SelectItem>
                        <SelectItem value="2">2</SelectItem>
                        <SelectItem value="5">5</SelectItem>
                        <SelectItem value="10">10</SelectItem>
                        <SelectItem value="25">25</SelectItem>
                        <SelectItem value="50">50</SelectItem>
                        <SelectItem value="100">100</SelectItem>
                      </SelectContent>
                    </Select>
                    <span className="text-slate-400">{customizeProduct.quantity}</span>
                  </div>
                </div>
              </div>

              {/* Live Preview */}
              <div className="space-y-4">
                <h3 className="font-semibold text-white flex items-center gap-2">
                  <Eye className="h-4 w-4" />
                  Live Preview
                </h3>
                
                <div 
                  className="rounded-xl overflow-hidden border border-white/10"
                  style={{ 
                    backgroundColor: COLOR_SCHEMES.find(s => s.id === customization.colorScheme)?.primary || "#1e3a5f"
                  }}
                >
                  {/* Preview based on product type */}
                  {customizeProduct.category === "cards" && (
                    <div className="p-6 aspect-[3.5/2] flex flex-col justify-between">
                      <div>
                        <p 
                          className="text-xl font-bold"
                          style={{ color: COLOR_SCHEMES.find(s => s.id === customization.colorScheme)?.secondary || "#d4af37" }}
                        >
                          {customization.agentName || "Your Name"}
                        </p>
                        <p className="text-white/80 text-sm mt-1">
                          {customization.brokerage || "Your Brokerage"}
                        </p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-white/90 text-sm">{customization.phone || "(555) 123-4567"}</p>
                        <p className="text-white/90 text-sm">{customization.email || "email@example.com"}</p>
                        {customization.tagline && (
                          <p 
                            className="text-xs italic mt-2"
                            style={{ color: COLOR_SCHEMES.find(s => s.id === customization.colorScheme)?.secondary || "#d4af37" }}
                          >
                            "{customization.tagline}"
                          </p>
                        )}
                      </div>
                    </div>
                  )}

                  {customizeProduct.category === "signs" && (
                    <div className="p-8 aspect-[3/4] flex flex-col items-center justify-center text-center">
                      <p 
                        className="text-3xl font-bold mb-2"
                        style={{ color: COLOR_SCHEMES.find(s => s.id === customization.colorScheme)?.secondary || "#d4af37" }}
                      >
                        FOR SALE
                      </p>
                      <div className="my-4 py-4 border-t border-b border-white/30 w-full">
                        <p className="text-white text-xl font-semibold">
                          {customization.agentName || "Agent Name"}
                        </p>
                        <p className="text-white/80 text-lg mt-1">
                          {customization.phone || "(555) 123-4567"}
                        </p>
                      </div>
                      <p className="text-white/70 text-sm">
                        {customization.brokerage || "Brokerage Name"}
                      </p>
                    </div>
                  )}

                  {(customizeProduct.category === "flyers" || customizeProduct.category === "postcards") && (
                    <div className="p-6 aspect-[8.5/11] flex flex-col">
                      <div 
                        className="text-center py-4 mb-4"
                        style={{ borderBottom: `2px solid ${COLOR_SCHEMES.find(s => s.id === customization.colorScheme)?.secondary || "#d4af37"}` }}
                      >
                        <p 
                          className="text-2xl font-bold"
                          style={{ color: COLOR_SCHEMES.find(s => s.id === customization.colorScheme)?.secondary || "#d4af37" }}
                        >
                          {customization.brokerage || "Your Brokerage"}
                        </p>
                      </div>
                      <div className="flex-1 bg-white/10 rounded-lg flex items-center justify-center">
                        <p className="text-white/50">Property Image</p>
                      </div>
                      <div className="mt-4 pt-4 border-t border-white/20 flex justify-between items-end">
                        <div>
                          <p className="text-white font-semibold">{customization.agentName || "Agent Name"}</p>
                          <p className="text-white/80 text-sm">{customization.phone || "(555) 123-4567"}</p>
                        </div>
                        {customization.tagline && (
                          <p 
                            className="text-sm italic"
                            style={{ color: COLOR_SCHEMES.find(s => s.id === customization.colorScheme)?.secondary || "#d4af37" }}
                          >
                            {customization.tagline}
                          </p>
                        )}
                      </div>
                    </div>
                  )}

                  {(customizeProduct.category === "banners" || customizeProduct.category === "hangers") && (
                    <div className="p-6 aspect-[3/1] flex items-center justify-between">
                      <div>
                        <p 
                          className="text-2xl font-bold"
                          style={{ color: COLOR_SCHEMES.find(s => s.id === customization.colorScheme)?.secondary || "#d4af37" }}
                        >
                          {customization.agentName || "Agent Name"}
                        </p>
                        <p className="text-white/80">{customization.brokerage || "Brokerage"}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-white text-xl">{customization.phone || "(555) 123-4567"}</p>
                        {customization.tagline && (
                          <p className="text-white/70 text-sm italic">"{customization.tagline}"</p>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Order Summary */}
                <Card className="p-4 bg-white/5">
                  <div className="flex justify-between items-center mb-3">
                    <span className="text-slate-400">Unit Price:</span>
                    <span className="text-white">${customizeProduct.price}</span>
                  </div>
                  <div className="flex justify-between items-center mb-3">
                    <span className="text-slate-400">Quantity:</span>
                    <span className="text-white">{customization.quantity} x {customizeProduct.quantity}</span>
                  </div>
                  <div className="flex justify-between items-center pt-3 border-t border-white/10">
                    <span className="text-white font-semibold">Total:</span>
                    <span className="text-2xl font-bold text-primary">
                      ${(customizeProduct.price * customization.quantity).toFixed(2)}
                    </span>
                  </div>
                </Card>

                <Button 
                  className="w-full" 
                  size="lg"
                  onClick={() => {
                    handleAddToCart({ ...customizeProduct, customization }, "physical")
                    setCustomizeProduct(null)
                    setCustomization({
                      agentName: "",
                      phone: "",
                      email: "",
                      brokerage: "",
                      tagline: "",
                      colorScheme: "navy-gold",
                      logoUrl: "",
                      quantity: 1,
                    })
                  }}
                >
                  <ShoppingCart className="h-4 w-4 mr-2" />
                  Add to Cart - ${(customizeProduct.price * customization.quantity).toFixed(2)}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
