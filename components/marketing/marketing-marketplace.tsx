"use client"

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

interface ZipCodeListing {
  id: string
  zipCode: string
  area: string
  state: string
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

// Helper to generate zip listings
const createZip = (
  zipCode: string,
  area: string,
  avgHomePrice: number,
  monthlyLeads: number,
  marketDemand: "high" | "medium" | "low",
  price: number,
  spotsAvailable: number,
  popular?: boolean
): ZipCodeListing => ({
  id: `zip-${zipCode}`,
  zipCode,
  area,
  state: "FL",
  avgHomePrice,
  activeListings: Math.floor(monthlyLeads * 0.6),
  monthlyLeads,
  marketDemand,
  price,
  icon: <MapPin className="h-6 w-6" />,
  popular,
  image: `/images/zip-codes/${area.toLowerCase().replace(/[^a-z0-9]/g, '-')}.jpg`,
  spotsAvailable,
  totalSpots: 3,
})

const ZIP_CODE_LISTINGS: ZipCodeListing[] = [
  // SOUTH FLORIDA - Miami-Dade County
  createZip("33139", "Miami Beach", 1850000, 210, "high", 349, 1, true),
  createZip("33109", "Fisher Island", 3200000, 85, "high", 399, 2, true),
  createZip("33140", "North Miami Beach", 950000, 165, "medium", 199, 2),
  createZip("33131", "Brickell", 1200000, 280, "high", 329, 1, true),
  createZip("33132", "Downtown Miami", 850000, 245, "high", 299, 2),
  createZip("33125", "Little Havana", 420000, 180, "medium", 149, 3),
  createZip("33133", "Coconut Grove", 1450000, 165, "high", 319, 2, true),
  createZip("33134", "Coral Gables", 1650000, 190, "high", 339, 1, true),
  createZip("33143", "South Miami", 780000, 145, "medium", 189, 3),
  createZip("33156", "Pinecrest", 1350000, 135, "high", 299, 2),
  createZip("33157", "Palmetto Bay", 650000, 140, "medium", 169, 3),
  createZip("33158", "Cutler Bay", 480000, 155, "medium", 139, 3),
  createZip("33160", "Sunny Isles Beach", 1100000, 175, "high", 279, 1),
  createZip("33162", "North Miami", 520000, 160, "medium", 159, 2),
  createZip("33165", "Westchester", 450000, 170, "medium", 139, 3),
  createZip("33166", "Hialeah", 380000, 195, "low", 109, 3),
  createZip("33169", "Miami Gardens", 350000, 185, "low", 99, 3),
  createZip("33172", "Doral", 580000, 210, "high", 219, 2),
  createZip("33175", "Kendall", 520000, 225, "medium", 179, 2),
  createZip("33176", "The Hammocks", 490000, 190, "medium", 159, 3),
  createZip("33177", "Richmond Heights", 420000, 165, "low", 119, 3),
  createZip("33178", "Doral West", 540000, 180, "medium", 189, 3),
  createZip("33179", "Aventura", 890000, 195, "high", 259, 1),
  createZip("33180", "Ojus", 720000, 145, "medium", 199, 3),
  createZip("33181", "North Bay Village", 650000, 125, "medium", 179, 2),
  createZip("33182", "Fontainebleau", 480000, 175, "medium", 149, 3),
  createZip("33183", "Sunset", 550000, 185, "medium", 169, 3),
  createZip("33184", "Tamiami", 420000, 170, "low", 129, 3),
  createZip("33185", "Kendale Lakes", 480000, 180, "medium", 149, 3),
  createZip("33186", "The Falls", 520000, 165, "medium", 169, 3),
  createZip("33187", "West Kendall", 460000, 175, "medium", 149, 3),
  createZip("33189", "Perrine", 390000, 150, "low", 109, 3),
  createZip("33190", "Cutler Ridge", 410000, 145, "low", 119, 3),
  createZip("33193", "Country Walk", 520000, 160, "medium", 159, 3),
  createZip("33194", "Country Club", 480000, 155, "medium", 149, 3),
  createZip("33196", "West Kendall South", 490000, 165, "medium", 159, 3),
  createZip("33030", "Homestead", 340000, 180, "low", 90, 3),
  createZip("33031", "Homestead South", 320000, 165, "low", 90, 3),
  createZip("33033", "Florida City", 290000, 145, "low", 90, 3),
  createZip("33034", "Naranja", 310000, 150, "low", 90, 3),
  createZip("33035", "Leisure City", 300000, 140, "low", 90, 3),
  
  // SOUTH FLORIDA - Broward County
  createZip("33301", "Fort Lauderdale Beach", 1250000, 185, "high", 299, 3),
  createZip("33304", "Wilton Manors", 680000, 140, "medium", 179, 3),
  createZip("33305", "Oakland Park", 480000, 155, "medium", 149, 3),
  createZip("33306", "Fort Lauderdale NE", 720000, 145, "medium", 189, 2),
  createZip("33308", "Lauderdale-by-the-Sea", 950000, 125, "high", 249, 2),
  createZip("33309", "Fort Lauderdale NW", 420000, 160, "medium", 139, 3),
  createZip("33311", "Fort Lauderdale SW", 350000, 175, "low", 109, 3),
  createZip("33312", "Fort Lauderdale S", 390000, 165, "low", 119, 3),
  createZip("33313", "Lauderhill", 320000, 180, "low", 99, 3),
  createZip("33314", "Davie", 480000, 175, "medium", 159, 3),
  createZip("33315", "Fort Lauderdale W", 410000, 155, "medium", 139, 3),
  createZip("33316", "Fort Lauderdale Beach S", 1100000, 165, "high", 279, 1),
  createZip("33317", "Plantation East", 520000, 170, "medium", 169, 3),
  createZip("33319", "Lauderhill West", 340000, 165, "low", 109, 3),
  createZip("33321", "Tamarac", 380000, 175, "medium", 129, 3),
  createZip("33322", "Sunrise", 420000, 185, "medium", 139, 3),
  createZip("33323", "Sunrise West", 450000, 170, "medium", 149, 3),
  createZip("33324", "Plantation", 540000, 180, "medium", 179, 2),
  createZip("33325", "Weston North", 620000, 165, "high", 199, 2),
  createZip("33326", "Weston", 680000, 175, "high", 219, 2, true),
  createZip("33327", "Weston West", 590000, 155, "medium", 189, 3),
  createZip("33328", "Davie West", 510000, 160, "medium", 169, 3),
  createZip("33330", "Cooper City", 580000, 165, "medium", 179, 3),
  createZip("33331", "Southwest Ranches", 850000, 125, "high", 249, 2),
  createZip("33332", "Southwest Ranches West", 920000, 115, "high", 269, 2),
  createZip("33334", "Pompano Beach", 520000, 175, "medium", 169, 3),
  createZip("33351", "Sunrise NW", 390000, 165, "medium", 129, 3),
  createZip("33060", "Pompano Beach E", 680000, 155, "medium", 189, 2),
  createZip("33062", "Pompano Beach Beach", 890000, 145, "high", 239, 2),
  createZip("33063", "Margate", 380000, 175, "medium", 129, 3),
  createZip("33064", "Pompano Beach N", 480000, 160, "medium", 149, 3),
  createZip("33065", "Coral Springs East", 520000, 185, "medium", 169, 3),
  createZip("33066", "Coral Springs", 560000, 195, "medium", 179, 2),
  createZip("33067", "Parkland", 750000, 155, "high", 229, 2, true),
  createZip("33068", "North Lauderdale", 350000, 170, "low", 109, 3),
  createZip("33069", "Pompano Beach W", 420000, 165, "medium", 139, 3),
  createZip("33071", "Coral Springs W", 480000, 175, "medium", 159, 3),
  createZip("33073", "Coconut Creek", 450000, 180, "medium", 149, 3),
  createZip("33076", "Coconut Creek W", 520000, 165, "medium", 169, 3),
  createZip("33441", "Deerfield Beach", 580000, 160, "medium", 179, 2),
  createZip("33442", "Deerfield Beach W", 490000, 155, "medium", 159, 3),
  createZip("33019", "Hollywood Beach", 780000, 165, "high", 219, 2),
  createZip("33020", "Hollywood", 450000, 175, "medium", 149, 3),
  createZip("33021", "Hollywood Hills", 520000, 165, "medium", 169, 3),
  createZip("33023", "Miramar East", 420000, 185, "medium", 139, 3),
  createZip("33024", "Pembroke Pines E", 480000, 190, "medium", 159, 3),
  createZip("33025", "Pembroke Pines", 510000, 200, "medium", 169, 2),
  createZip("33026", "Pembroke Pines W", 540000, 185, "medium", 179, 3),
  createZip("33027", "Miramar", 490000, 195, "medium", 159, 3),
  createZip("33028", "Pembroke Pines NW", 560000, 180, "medium", 179, 3),
  createZip("33029", "Miramar West", 520000, 175, "medium", 169, 3),
  createZip("33004", "Dania Beach", 520000, 145, "medium", 169, 3),
  createZip("33009", "Hallandale Beach", 580000, 160, "medium", 179, 2),
  
  // SOUTH FLORIDA - Palm Beach County
  createZip("33480", "Palm Beach", 2400000, 120, "high", 379, 0, true),
  createZip("33401", "West Palm Beach Downtown", 680000, 195, "high", 219, 2),
  createZip("33403", "West Palm Beach N", 420000, 165, "medium", 149, 3),
  createZip("33404", "Riviera Beach", 380000, 155, "low", 119, 3),
  createZip("33405", "West Palm Beach S", 520000, 170, "medium", 169, 3),
  createZip("33406", "West Palm Beach SW", 450000, 175, "medium", 149, 3),
  createZip("33407", "West Palm Beach NW", 380000, 165, "low", 119, 3),
  createZip("33409", "West Palm Beach W", 490000, 160, "medium", 159, 3),
  createZip("33410", "Palm Beach Gardens N", 620000, 155, "high", 199, 2),
  createZip("33411", "Royal Palm Beach", 480000, 185, "medium", 159, 3),
  createZip("33412", "Wellington West", 550000, 165, "medium", 179, 3),
  createZip("33413", "Greenacres", 380000, 175, "low", 119, 3),
  createZip("33414", "Wellington", 620000, 175, "high", 199, 2),
  createZip("33415", "West Palm Beach W", 350000, 170, "low", 109, 3),
  createZip("33417", "West Palm Beach NW", 420000, 165, "medium", 139, 3),
  createZip("33418", "Palm Beach Gardens", 720000, 165, "high", 229, 2, true),
  createZip("33426", "Boynton Beach E", 480000, 175, "medium", 159, 3),
  createZip("33428", "Boca Raton W", 580000, 170, "medium", 189, 3),
  createZip("33430", "Belle Glade", 220000, 125, "low", 90, 3),
  createZip("33431", "Boca Raton E", 890000, 165, "high", 259, 2),
  createZip("33432", "Boca Raton Downtown", 950000, 155, "high", 279, 1, true),
  createZip("33433", "Boca Raton W", 680000, 175, "high", 219, 2),
  createZip("33434", "Boca Raton NW", 720000, 165, "high", 229, 2),
  createZip("33435", "Boynton Beach", 420000, 180, "medium", 139, 3),
  createZip("33436", "Boynton Beach W", 480000, 175, "medium", 159, 3),
  createZip("33437", "Boynton Beach SW", 520000, 165, "medium", 169, 3),
  createZip("33438", "Canal Point", 280000, 115, "low", 90, 3),
  createZip("33440", "Clewiston", 240000, 120, "low", 90, 3),
  createZip("33444", "Delray Beach", 620000, 175, "high", 199, 2),
  createZip("33445", "Delray Beach W", 520000, 165, "medium", 169, 3),
  createZip("33446", "Delray Beach SW", 580000, 160, "medium", 179, 3),
  createZip("33449", "Lake Worth W", 450000, 155, "medium", 149, 3),
  createZip("33458", "Jupiter", 680000, 175, "high", 219, 2, true),
  createZip("33460", "Lake Worth Beach", 420000, 165, "medium", 139, 3),
  createZip("33461", "Lake Worth", 380000, 175, "low", 119, 3),
  createZip("33462", "Atlantis", 550000, 145, "medium", 179, 3),
  createZip("33463", "Lake Worth W", 420000, 170, "medium", 139, 3),
  createZip("33467", "Lake Worth SW", 480000, 165, "medium", 159, 3),
  createZip("33469", "Jupiter Inlet", 920000, 135, "high", 269, 2),
  createZip("33470", "Loxahatchee", 520000, 155, "medium", 169, 3),
  createZip("33471", "Moore Haven", 210000, 110, "low", 90, 3),
  createZip("33473", "Boca Raton S", 750000, 160, "high", 239, 2),
  createZip("33476", "Pahokee", 200000, 105, "low", 90, 3),
  createZip("33477", "Jupiter S", 780000, 150, "high", 249, 2),
  createZip("33478", "Jupiter Farms", 620000, 145, "medium", 199, 3),
  createZip("33483", "Delray Beach E", 850000, 155, "high", 249, 2),
  createZip("33484", "Delray Beach S", 580000, 165, "medium", 179, 3),
  createZip("33486", "Boca Raton SE", 980000, 150, "high", 289, 1),
  createZip("33487", "Boca Raton NE", 820000, 155, "high", 249, 2),
  createZip("33493", "South Bay", 190000, 100, "low", 90, 3),
  createZip("33496", "Boca Raton N", 1100000, 145, "high", 299, 1, true),
  createZip("33498", "Boca Raton W", 680000, 160, "high", 219, 2),
  
  // CENTRAL FLORIDA - Orlando Metro
  createZip("32801", "Downtown Orlando", 520000, 220, "high", 249, 1),
  createZip("32789", "Winter Park", 750000, 175, "high", 279, 2),
  createZip("34786", "Windermere", 1100000, 145, "high", 329, 3),
  createZip("32819", "Dr. Phillips", 650000, 195, "medium", 189, 1),
  createZip("32836", "Lake Buena Vista", 580000, 160, "medium", 169, 2),
  createZip("34747", "Celebration", 620000, 130, "medium", 179, 3),
  createZip("32746", "Lake Mary", 480000, 185, "medium", 149, 2),
  createZip("34711", "Clermont", 420000, 210, "medium", 129, 3),
  createZip("32765", "Oviedo", 450000, 155, "low", 99, 3),
  createZip("34744", "Kissimmee", 380000, 240, "low", 90, 3),
  createZip("32803", "Colonial Town", 580000, 165, "medium", 179, 2),
  createZip("32804", "College Park", 520000, 175, "medium", 169, 3),
  createZip("32805", "Parramore", 320000, 145, "low", 99, 3),
  createZip("32806", "Delaney Park", 480000, 160, "medium", 159, 3),
  createZip("32807", "Azalea Park", 380000, 175, "low", 119, 3),
  createZip("32808", "Pine Hills", 290000, 185, "low", 90, 3),
  createZip("32809", "Sky Lake", 420000, 165, "medium", 139, 3),
  createZip("32810", "Lockhart", 350000, 170, "low", 109, 3),
  createZip("32811", "Orlovista", 320000, 160, "low", 99, 3),
  createZip("32812", "Conway", 450000, 175, "medium", 149, 3),
  createZip("32814", "Baldwin Park", 620000, 155, "high", 199, 2),
  createZip("32817", "UCF Area", 380000, 195, "medium", 129, 3),
  createZip("32818", "Rosemont", 340000, 180, "low", 109, 3),
  createZip("32820", "Bithlo", 280000, 125, "low", 90, 3),
  createZip("32821", "Hunters Creek", 420000, 185, "medium", 139, 3),
  createZip("32822", "Rio Grande", 350000, 170, "low", 109, 3),
  createZip("32824", "Meadow Woods", 380000, 190, "medium", 129, 3),
  createZip("32825", "Waterford Lakes", 410000, 185, "medium", 139, 3),
  createZip("32826", "Alafaya", 390000, 195, "medium", 129, 3),
  createZip("32827", "Lake Nona", 580000, 175, "high", 199, 2, true),
  createZip("32828", "Avalon Park", 420000, 185, "medium", 149, 3),
  createZip("32829", "Lake Nona South", 520000, 165, "high", 179, 2),
  createZip("32830", "Lake Buena Vista S", 480000, 145, "medium", 159, 3),
  createZip("32831", "Orlando International", 390000, 135, "low", 119, 3),
  createZip("32832", "Narcoossee", 450000, 160, "medium", 149, 3),
  createZip("32833", "Christmas", 320000, 115, "low", 99, 3),
  createZip("32835", "MetroWest", 380000, 185, "medium", 129, 3),
  createZip("32837", "Southchase", 420000, 180, "medium", 139, 3),
  createZip("32839", "Oak Ridge", 340000, 175, "low", 109, 3),
  
  // CENTRAL FLORIDA - Seminole County
  createZip("32701", "Altamonte Springs", 380000, 175, "medium", 129, 3),
  createZip("32703", "Apopka", 350000, 185, "medium", 119, 3),
  createZip("32707", "Casselberry", 360000, 165, "medium", 119, 3),
  createZip("32708", "Winter Springs", 420000, 170, "medium", 139, 3),
  createZip("32714", "Altamonte Springs N", 410000, 165, "medium", 139, 3),
  createZip("32730", "Eatonville", 290000, 125, "low", 90, 3),
  createZip("32732", "Geneva", 480000, 115, "low", 149, 3),
  createZip("32750", "Longwood", 420000, 175, "medium", 139, 3),
  createZip("32751", "Maitland", 580000, 160, "high", 189, 2),
  createZip("32757", "Mount Dora", 380000, 155, "medium", 129, 3),
  createZip("32763", "Orange City", 340000, 165, "low", 109, 3),
  createZip("32766", "Oviedo N", 480000, 160, "medium", 159, 3),
  createZip("32771", "Sanford", 350000, 185, "medium", 119, 3),
  createZip("32773", "Sanford N", 380000, 170, "medium", 129, 3),
  createZip("32779", "Longwood W", 450000, 165, "medium", 149, 3),
  createZip("32792", "Winter Park E", 620000, 155, "high", 199, 2),
  
  // CENTRAL FLORIDA - Lake County
  createZip("34705", "Astatula", 320000, 135, "low", 99, 3),
  createZip("34714", "Clermont S", 390000, 175, "medium", 129, 3),
  createZip("34715", "Clermont N", 420000, 180, "medium", 139, 3),
  createZip("34731", "Fruitland Park", 310000, 145, "low", 99, 3),
  createZip("34736", "Groveland", 350000, 165, "low", 109, 3),
  createZip("34737", "Howey-in-the-Hills", 380000, 125, "low", 119, 3),
  createZip("34748", "Leesburg", 320000, 175, "low", 99, 3),
  createZip("34753", "Mascotte", 300000, 145, "low", 99, 3),
  createZip("34756", "Montverde", 520000, 125, "medium", 169, 3),
  createZip("34760", "Oakland", 480000, 135, "medium", 159, 3),
  createZip("34787", "Winter Garden", 450000, 195, "medium", 149, 3),
  createZip("34788", "Leesburg E", 340000, 165, "low", 109, 3),
  
  // CENTRAL FLORIDA - Osceola County
  createZip("34741", "Kissimmee N", 360000, 195, "low", 109, 3),
  createZip("34743", "Kissimmee E", 340000, 185, "low", 99, 3),
  createZip("34746", "Kissimmee S", 380000, 200, "medium", 119, 3),
  createZip("34758", "Poinciana", 320000, 210, "low", 99, 3),
  createZip("34769", "St. Cloud", 350000, 185, "medium", 119, 3),
  createZip("34771", "St. Cloud E", 380000, 170, "medium", 129, 3),
  createZip("34772", "St. Cloud S", 360000, 175, "low", 109, 3),
  
  // TAMPA BAY AREA - Hillsborough County
  createZip("33602", "Downtown Tampa", 580000, 195, "high", 199, 2, true),
  createZip("33603", "Seminole Heights", 420000, 175, "medium", 149, 3),
  createZip("33604", "Tampa Heights", 380000, 165, "medium", 129, 3),
  createZip("33605", "Ybor City", 350000, 155, "medium", 119, 3),
  createZip("33606", "Hyde Park", 850000, 165, "high", 269, 1, true),
  createZip("33607", "West Tampa", 420000, 170, "medium", 139, 3),
  createZip("33609", "Palma Ceia", 720000, 155, "high", 229, 2),
  createZip("33610", "East Tampa", 290000, 175, "low", 90, 3),
  createZip("33611", "South Tampa", 680000, 165, "high", 219, 2),
  createZip("33612", "University Area", 320000, 185, "low", 99, 3),
  createZip("33613", "North Tampa", 350000, 175, "medium", 109, 3),
  createZip("33614", "Town N Country", 380000, 180, "medium", 129, 3),
  createZip("33615", "Town N Country W", 420000, 175, "medium", 139, 3),
  createZip("33616", "MacDill AFB Area", 480000, 145, "medium", 159, 3),
  createZip("33617", "Temple Terrace", 380000, 170, "medium", 129, 3),
  createZip("33618", "Carrollwood", 450000, 175, "medium", 149, 3),
  createZip("33619", "Progress Village", 310000, 165, "low", 99, 3),
  createZip("33620", "USF Area", 340000, 185, "medium", 109, 3),
  createZip("33621", "Westshore", 520000, 160, "medium", 169, 3),
  createZip("33624", "Northdale", 420000, 180, "medium", 139, 3),
  createZip("33625", "Citrus Park", 450000, 175, "medium", 149, 3),
  createZip("33626", "Westchase", 550000, 170, "high", 179, 2),
  createZip("33629", "Beach Park", 980000, 145, "high", 289, 1),
  createZip("33634", "Egypt Lake", 360000, 170, "low", 109, 3),
  createZip("33635", "Westchase N", 480000, 165, "medium", 159, 3),
  createZip("33647", "New Tampa", 480000, 195, "medium", 159, 2),
  createZip("33510", "Brandon", 380000, 185, "medium", 129, 3),
  createZip("33511", "Brandon E", 420000, 180, "medium", 139, 3),
  createZip("33527", "Dover", 350000, 145, "low", 109, 3),
  createZip("33534", "Gibsonton", 320000, 160, "low", 99, 3),
  createZip("33547", "Lithia", 520000, 165, "medium", 169, 3),
  createZip("33549", "Lutz", 480000, 175, "medium", 159, 3),
  createZip("33556", "Odessa", 520000, 165, "medium", 169, 3),
  createZip("33558", "Odessa N", 480000, 160, "medium", 159, 3),
  createZip("33559", "Lutz E", 520000, 170, "medium", 169, 3),
  createZip("33569", "Riverview", 380000, 200, "medium", 129, 3),
  createZip("33570", "Ruskin", 350000, 175, "low", 109, 3),
  createZip("33572", "Apollo Beach", 420000, 165, "medium", 139, 3),
  createZip("33573", "Sun City Center", 380000, 155, "medium", 129, 3),
  createZip("33578", "Riverview S", 390000, 195, "medium", 129, 3),
  createZip("33579", "Riverview E", 410000, 190, "medium", 139, 3),
  createZip("33584", "Seffner", 380000, 165, "medium", 129, 3),
  createZip("33592", "Thonotosassa", 420000, 150, "medium", 139, 3),
  createZip("33594", "Valrico", 420000, 180, "medium", 139, 3),
  createZip("33596", "Valrico S", 450000, 175, "medium", 149, 3),
  createZip("33598", "Wimauma", 340000, 160, "low", 109, 3),
  createZip("33567", "Plant City", 350000, 175, "low", 109, 3),
  
  // TAMPA BAY AREA - Pinellas County
  createZip("33701", "Downtown St. Petersburg", 520000, 175, "high", 179, 2),
  createZip("33702", "Northeast St. Pete", 450000, 165, "medium", 149, 3),
  createZip("33703", "Shore Acres", 480000, 160, "medium", 159, 3),
  createZip("33704", "Snell Isle", 680000, 145, "high", 219, 2),
  createZip("33705", "Childs Park", 350000, 170, "low", 109, 3),
  createZip("33706", "St. Pete Beach", 720000, 155, "high", 229, 2, true),
  createZip("33707", "South St. Pete", 380000, 165, "medium", 129, 3),
  createZip("33708", "Madeira Beach", 580000, 145, "high", 189, 2),
  createZip("33709", "Kenneth City", 380000, 170, "medium", 129, 3),
  createZip("33710", "Tyrone", 420000, 175, "medium", 139, 3),
  createZip("33711", "South Side", 320000, 165, "low", 99, 3),
  createZip("33712", "Midtown St. Pete", 350000, 175, "low", 109, 3),
  createZip("33713", "Central St. Pete", 380000, 180, "medium", 129, 3),
  createZip("33714", "North St. Pete", 340000, 170, "low", 109, 3),
  createZip("33715", "Tierra Verde", 850000, 125, "high", 269, 2),
  createZip("33716", "Gateway", 420000, 165, "medium", 139, 3),
  createZip("33755", "Clearwater Downtown", 420000, 175, "medium", 139, 3),
  createZip("33756", "Clearwater S", 450000, 170, "medium", 149, 3),
  createZip("33759", "Clearwater N", 380000, 165, "medium", 129, 3),
  createZip("33760", "Clearwater E", 410000, 160, "medium", 139, 3),
  createZip("33761", "Clearwater NE", 450000, 155, "medium", 149, 3),
  createZip("33762", "Feather Sound", 480000, 150, "medium", 159, 3),
  createZip("33763", "Clearwater NW", 420000, 165, "medium", 139, 3),
  createZip("33764", "Clearwater Central", 390000, 170, "medium", 129, 3),
  createZip("33765", "Clearwater W", 480000, 160, "medium", 159, 3),
  createZip("33767", "Clearwater Beach", 890000, 145, "high", 279, 1, true),
  createZip("33770", "Largo", 380000, 180, "medium", 129, 3),
  createZip("33771", "Largo E", 420000, 175, "medium", 139, 3),
  createZip("33772", "Seminole", 480000, 165, "medium", 159, 3),
  createZip("33773", "Largo N", 390000, 170, "medium", 129, 3),
  createZip("33774", "Largo W", 420000, 165, "medium", 139, 3),
  createZip("33776", "Indian Rocks Beach", 680000, 135, "high", 219, 2),
  createZip("33777", "Largo S", 410000, 170, "medium", 139, 3),
  createZip("33778", "Largo SW", 450000, 160, "medium", 149, 3),
  createZip("33781", "Pinellas Park", 350000, 185, "medium", 119, 3),
  createZip("33782", "Pinellas Park E", 380000, 175, "medium", 129, 3),
  createZip("33785", "Indian Shores", 620000, 130, "high", 199, 2),
  createZip("33786", "Belleair Beach", 780000, 125, "high", 249, 2),
  createZip("34677", "Oldsmar", 450000, 170, "medium", 149, 3),
  createZip("34683", "Palm Harbor", 480000, 175, "medium", 159, 3),
  createZip("34684", "Palm Harbor N", 520000, 165, "medium", 169, 3),
  createZip("34685", "Palm Harbor E", 450000, 170, "medium", 149, 3),
  createZip("34688", "Tarpon Springs", 420000, 165, "medium", 139, 3),
  createZip("34689", "Tarpon Springs W", 480000, 155, "medium", 159, 3),
  createZip("34695", "Safety Harbor", 450000, 160, "medium", 149, 3),
  createZip("34698", "Dunedin", 520000, 165, "medium", 169, 3),
  
  // TAMPA BAY AREA - Pasco County
  createZip("33523", "Dade City", 320000, 155, "low", 99, 3),
  createZip("33525", "Dade City N", 350000, 145, "low", 109, 3),
  createZip("33540", "Zephyrhills", 320000, 165, "low", 99, 3),
  createZip("33541", "Zephyrhills S", 340000, 160, "low", 109, 3),
  createZip("33542", "Zephyrhills W", 350000, 155, "low", 109, 3),
  createZip("33543", "Wesley Chapel", 420000, 195, "medium", 139, 3),
  createZip("33544", "Wesley Chapel N", 450000, 185, "medium", 149, 3),
  createZip("33545", "Wesley Chapel E", 410000, 175, "medium", 139, 3),
  createZip("34637", "Land O Lakes", 420000, 185, "medium", 139, 3),
  createZip("34638", "Land O Lakes E", 450000, 180, "medium", 149, 3),
  createZip("34639", "Land O Lakes W", 440000, 175, "medium", 149, 3),
  createZip("34652", "New Port Richey", 320000, 165, "low", 99, 3),
  createZip("34653", "New Port Richey E", 350000, 160, "low", 109, 3),
  createZip("34654", "New Port Richey N", 340000, 155, "low", 109, 3),
  createZip("34655", "Trinity", 480000, 175, "medium", 159, 3),
  createZip("34667", "Hudson", 290000, 160, "low", 90, 3),
  createZip("34668", "Port Richey", 280000, 165, "low", 90, 3),
  createZip("34669", "Hudson N", 310000, 155, "low", 99, 3),
  createZip("34690", "Holiday", 310000, 165, "low", 99, 3),
  createZip("34691", "Holiday W", 330000, 160, "low", 109, 3),
  
  // SOUTHWEST FLORIDA - Sarasota County
  createZip("34230", "Downtown Sarasota", 620000, 165, "high", 199, 2, true),
  createZip("34231", "Gulf Gate", 450000, 160, "medium", 149, 3),
  createZip("34232", "Sarasota E", 420000, 170, "medium", 139, 3),
  createZip("34233", "Sarasota S", 480000, 165, "medium", 159, 3),
  createZip("34234", "Sarasota N", 380000, 175, "medium", 129, 3),
  createZip("34235", "Sarasota NE", 450000, 165, "medium", 149, 3),
  createZip("34236", "St. Armands", 1200000, 135, "high", 329, 1, true),
  createZip("34237", "Sarasota Central", 420000, 170, "medium", 139, 3),
  createZip("34238", "Palmer Ranch", 550000, 160, "medium", 179, 3),
  createZip("34239", "Southgate", 520000, 155, "medium", 169, 3),
  createZip("34240", "Lakewood Ranch E", 580000, 175, "high", 189, 2),
  createZip("34241", "Fruitville", 480000, 165, "medium", 159, 3),
  createZip("34242", "Siesta Key", 1100000, 135, "high", 299, 1, true),
  createZip("34243", "Sarasota NW", 420000, 170, "medium", 139, 3),
  createZip("34275", "Nokomis", 520000, 155, "medium", 169, 3),
  createZip("34285", "Venice", 480000, 165, "medium", 159, 3),
  createZip("34286", "North Port", 350000, 185, "low", 109, 3),
  createZip("34287", "North Port E", 380000, 180, "medium", 119, 3),
  createZip("34288", "North Port S", 360000, 175, "low", 109, 3),
  createZip("34289", "North Port N", 370000, 170, "low", 119, 3),
  createZip("34291", "North Port W", 340000, 165, "low", 109, 3),
  createZip("34292", "Venice E", 520000, 160, "medium", 169, 3),
  createZip("34293", "Venice S", 480000, 155, "medium", 159, 3),
  
  // SOUTHWEST FLORIDA - Manatee County
  createZip("34201", "Lakewood Ranch", 580000, 180, "high", 189, 2, true),
  createZip("34202", "Lakewood Ranch W", 550000, 175, "high", 179, 3),
  createZip("34203", "Bradenton E", 420000, 170, "medium", 139, 3),
  createZip("34205", "Bradenton Downtown", 380000, 165, "medium", 129, 3),
  createZip("34207", "Bradenton S", 410000, 170, "medium", 139, 3),
  createZip("34208", "Bradenton E", 390000, 175, "medium", 129, 3),
  createZip("34209", "Bradenton W", 480000, 165, "medium", 159, 3),
  createZip("34210", "Bradenton Beach", 650000, 145, "high", 209, 2),
  createZip("34211", "Parrish", 420000, 185, "medium", 139, 3),
  createZip("34212", "Lakewood Ranch N", 520000, 175, "medium", 169, 3),
  createZip("34215", "Cortez", 580000, 140, "medium", 189, 3),
  createZip("34217", "Anna Maria", 950000, 125, "high", 289, 1),
  createZip("34219", "Parrish E", 390000, 175, "medium", 129, 3),
  createZip("34221", "Palmetto", 380000, 170, "medium", 129, 3),
  createZip("34222", "Ellenton", 420000, 165, "medium", 139, 3),
  createZip("34223", "Englewood", 450000, 160, "medium", 149, 3),
  createZip("34224", "Englewood S", 420000, 155, "medium", 139, 3),
  
  // SOUTHWEST FLORIDA - Lee County
  createZip("33901", "Downtown Fort Myers", 380000, 175, "medium", 129, 3),
  createZip("33903", "North Fort Myers", 350000, 170, "low", 109, 3),
  createZip("33904", "Cape Coral E", 420000, 185, "medium", 139, 3),
  createZip("33905", "Fort Myers E", 360000, 165, "low", 109, 3),
  createZip("33907", "Fort Myers S", 420000, 175, "medium", 139, 3),
  createZip("33908", "Fort Myers Beach", 580000, 155, "high", 189, 2),
  createZip("33909", "Cape Coral N", 380000, 185, "medium", 129, 3),
  createZip("33912", "Fort Myers SW", 450000, 170, "medium", 149, 3),
  createZip("33913", "Gateway", 420000, 175, "medium", 139, 3),
  createZip("33914", "Cape Coral S", 410000, 180, "medium", 139, 3),
  createZip("33916", "Fort Myers Central", 340000, 165, "low", 109, 3),
  createZip("33917", "North Fort Myers N", 380000, 170, "medium", 129, 3),
  createZip("33919", "Fort Myers W", 480000, 165, "medium", 159, 3),
  createZip("33920", "Alva", 420000, 135, "low", 139, 3),
  createZip("33921", "Boca Grande", 1500000, 95, "high", 349, 2, true),
  createZip("33922", "Bokeelia", 520000, 115, "medium", 169, 3),
  createZip("33924", "Captiva", 1800000, 85, "high", 379, 1, true),
  createZip("33928", "Estero", 520000, 175, "high", 169, 2),
  createZip("33931", "Fort Myers Beach S", 650000, 150, "high", 209, 2),
  createZip("33936", "Lehigh Acres", 290000, 210, "low", 90, 3),
  createZip("33956", "St. James City", 480000, 120, "medium", 159, 3),
  createZip("33957", "Sanibel", 1200000, 115, "high", 329, 1, true),
  createZip("33965", "Fort Myers SE", 380000, 170, "medium", 129, 3),
  createZip("33966", "Fort Myers SW", 420000, 175, "medium", 139, 3),
  createZip("33967", "San Carlos Park", 380000, 180, "medium", 129, 3),
  createZip("33971", "Lehigh Acres N", 310000, 195, "low", 99, 3),
  createZip("33972", "Lehigh Acres E", 300000, 200, "low", 99, 3),
  createZip("33973", "Lehigh Acres W", 320000, 190, "low", 99, 3),
  createZip("33974", "Lehigh Acres S", 290000, 185, "low", 90, 3),
  createZip("33976", "Lehigh Acres SE", 280000, 180, "low", 90, 3),
  createZip("33990", "Cape Coral SE", 450000, 180, "medium", 149, 3),
  createZip("33991", "Cape Coral SW", 480000, 175, "medium", 159, 3),
  createZip("33993", "Cape Coral NW", 420000, 185, "medium", 139, 3),
  
  // SOUTHWEST FLORIDA - Collier County
  createZip("34102", "Downtown Naples", 1200000, 145, "high", 329, 1, true),
  createZip("34103", "Park Shore", 1500000, 135, "high", 359, 1, true),
  createZip("34104", "Naples E", 520000, 175, "medium", 169, 3),
  createZip("34105", "Pine Ridge", 680000, 165, "high", 219, 2),
  createZip("34108", "Pelican Bay", 1100000, 145, "high", 299, 1),
  createZip("34109", "Naples N", 580000, 170, "medium", 189, 3),
  createZip("34110", "North Naples", 620000, 175, "high", 199, 2),
  createZip("34112", "East Naples", 450000, 180, "medium", 149, 3),
  createZip("34113", "Naples S", 520000, 170, "medium", 169, 3),
  createZip("34114", "Naples Manor", 380000, 175, "medium", 129, 3),
  createZip("34116", "Golden Gate", 420000, 185, "medium", 139, 3),
  createZip("34117", "Golden Gate Estates", 480000, 175, "medium", 159, 3),
  createZip("34119", "Vineyards", 620000, 165, "high", 199, 2),
  createZip("34120", "Golden Gate Estates N", 520000, 170, "medium", 169, 3),
  createZip("34134", "Bonita Springs", 550000, 175, "high", 179, 2),
  createZip("34135", "Bonita Springs E", 480000, 170, "medium", 159, 3),
  createZip("34140", "Goodland", 620000, 110, "medium", 199, 3),
  createZip("34141", "Ochopee", 280000, 85, "low", 90, 3),
  createZip("34142", "Immokalee", 220000, 145, "low", 90, 3),
  createZip("34145", "Marco Island", 950000, 145, "high", 279, 1, true),
  
  // SOUTHWEST FLORIDA - Charlotte County
  createZip("33948", "Port Charlotte", 350000, 175, "low", 109, 3),
  createZip("33950", "Punta Gorda", 420000, 165, "medium", 139, 3),
  createZip("33952", "Port Charlotte E", 340000, 170, "low", 109, 3),
  createZip("33953", "Port Charlotte N", 360000, 175, "low", 109, 3),
  createZip("33954", "Port Charlotte NE", 380000, 165, "medium", 129, 3),
  createZip("33955", "Punta Gorda S", 480000, 155, "medium", 159, 3),
  createZip("33980", "Port Charlotte S", 330000, 170, "low", 99, 3),
  createZip("33981", "Port Charlotte SW", 380000, 160, "medium", 129, 3),
  createZip("33982", "Port Charlotte W", 350000, 165, "low", 109, 3),
  createZip("33983", "Port Charlotte NW", 370000, 170, "low", 119, 3),
  
  // EAST COAST - Brevard County (Space Coast)
  createZip("32901", "Melbourne", 380000, 175, "medium", 129, 3),
  createZip("32903", "Indialantic", 580000, 145, "high", 189, 2),
  createZip("32904", "Melbourne W", 420000, 170, "medium", 139, 3),
  createZip("32905", "Palm Bay N", 350000, 185, "low", 109, 3),
  createZip("32907", "Palm Bay", 340000, 195, "low", 109, 3),
  createZip("32908", "Palm Bay S", 320000, 180, "low", 99, 3),
  createZip("32909", "Palm Bay SE", 350000, 190, "low", 109, 3),
  createZip("32920", "Cape Canaveral", 420000, 155, "medium", 139, 3),
  createZip("32922", "Cocoa", 320000, 165, "low", 99, 3),
  createZip("32925", "Patrick AFB", 450000, 140, "medium", 149, 3),
  createZip("32926", "Cocoa W", 350000, 170, "low", 109, 3),
  createZip("32927", "Cocoa N", 380000, 175, "medium", 129, 3),
  createZip("32931", "Cocoa Beach", 520000, 155, "high", 169, 2),
  createZip("32934", "Melbourne E", 420000, 165, "medium", 139, 3),
  createZip("32935", "Melbourne S", 380000, 175, "medium", 129, 3),
  createZip("32937", "Satellite Beach", 480000, 155, "medium", 159, 3),
  createZip("32940", "Melbourne N", 450000, 175, "medium", 149, 3),
  createZip("32949", "Grant-Valkaria", 420000, 135, "low", 139, 3),
  createZip("32950", "Malabar", 480000, 140, "medium", 159, 3),
  createZip("32951", "Melbourne Beach", 680000, 135, "high", 219, 2),
  createZip("32952", "Merritt Island", 420000, 165, "medium", 139, 3),
  createZip("32953", "Merritt Island N", 450000, 160, "medium", 149, 3),
  createZip("32955", "Rockledge", 380000, 175, "medium", 129, 3),
  createZip("32958", "Sebastian", 380000, 165, "medium", 129, 3),
  createZip("32959", "Sharpes", 350000, 150, "low", 109, 3),
  createZip("32960", "Vero Beach", 450000, 165, "medium", 149, 3),
  createZip("32962", "Vero Beach S", 520000, 155, "medium", 169, 3),
  createZip("32963", "Vero Beach Barrier Island", 950000, 130, "high", 279, 1),
  createZip("32966", "Vero Beach W", 420000, 170, "medium", 139, 3),
  createZip("32967", "Vero Beach N", 480000, 160, "medium", 159, 3),
  createZip("32968", "Vero Beach SW", 390000, 175, "medium", 129, 3),
  createZip("32976", "Sebastian N", 350000, 160, "low", 109, 3),
  
  // EAST COAST - St. Lucie County
  createZip("34945", "Fort Pierce N", 320000, 165, "low", 99, 3),
  createZip("34946", "Fort Pierce", 340000, 175, "low", 109, 3),
  createZip("34947", "Fort Pierce W", 300000, 160, "low", 99, 3),
  createZip("34949", "Fort Pierce Beach", 420000, 145, "medium", 139, 3),
  createZip("34950", "Fort Pierce S", 350000, 170, "low", 109, 3),
  createZip("34951", "Fort Pierce SW", 380000, 165, "medium", 129, 3),
  createZip("34952", "Port St. Lucie E", 350000, 185, "low", 109, 3),
  createZip("34953", "Port St. Lucie", 340000, 200, "low", 109, 3),
  createZip("34983", "Port St. Lucie W", 360000, 195, "medium", 119, 3),
  createZip("34984", "Port St. Lucie S", 350000, 190, "low", 109, 3),
  createZip("34986", "Port St. Lucie N", 380000, 185, "medium", 129, 3),
  createZip("34987", "Port St. Lucie SW", 370000, 180, "medium", 119, 3),
  createZip("34988", "Port St. Lucie NW", 390000, 175, "medium", 129, 3),
  
  // EAST COAST - Martin County
  createZip("34990", "Palm City", 520000, 165, "medium", 169, 3),
  createZip("34994", "Stuart", 480000, 170, "medium", 159, 3),
  createZip("34996", "Stuart Beach", 680000, 145, "high", 219, 2),
  createZip("34997", "Stuart S", 450000, 160, "medium", 149, 3),
  createZip("33455", "Hobe Sound", 520000, 155, "medium", 169, 3),
  createZip("33458", "Jupiter N", 680000, 175, "high", 219, 2),
  
  // NORTH FLORIDA - Jacksonville Metro
  createZip("32202", "Downtown Jacksonville", 380000, 165, "medium", 129, 3),
  createZip("32204", "Riverside", 420000, 175, "medium", 139, 3),
  createZip("32205", "Murray Hill", 350000, 170, "medium", 119, 3),
  createZip("32206", "Springfield", 280000, 165, "low", 90, 3),
  createZip("32207", "San Marco", 520000, 165, "high", 169, 2),
  createZip("32208", "Northside", 250000, 175, "low", 90, 3),
  createZip("32209", "Northwest Jacksonville", 220000, 180, "low", 90, 3),
  createZip("32210", "Ortega", 380000, 170, "medium", 129, 3),
  createZip("32211", "Arlington", 320000, 175, "low", 99, 3),
  createZip("32212", "NAS Jacksonville", 350000, 155, "medium", 109, 3),
  createZip("32214", "San Jose", 420000, 165, "medium", 139, 3),
  createZip("32216", "Southside", 380000, 185, "medium", 129, 3),
  createZip("32217", "Mandarin N", 420000, 175, "medium", 139, 3),
  createZip("32218", "North Jacksonville", 290000, 185, "low", 90, 3),
  createZip("32219", "Northwest", 280000, 175, "low", 90, 3),
  createZip("32220", "Baldwin", 320000, 145, "low", 99, 3),
  createZip("32221", "Westside", 350000, 180, "low", 109, 3),
  createZip("32222", "Cecil Field", 320000, 165, "low", 99, 3),
  createZip("32223", "Mandarin", 450000, 180, "medium", 149, 3),
  createZip("32224", "Southside E", 420000, 175, "medium", 139, 3),
  createZip("32225", "Intracoastal West", 480000, 170, "medium", 159, 3),
  createZip("32226", "North Jacksonville E", 350000, 165, "low", 109, 3),
  createZip("32227", "Mayport", 380000, 150, "medium", 129, 3),
  createZip("32233", "Atlantic Beach", 580000, 145, "high", 189, 2),
  createZip("32234", "Jacksonville W", 310000, 160, "low", 99, 3),
  createZip("32244", "Westconnett", 320000, 175, "low", 99, 3),
  createZip("32246", "Tinseltown", 380000, 180, "medium", 129, 3),
  createZip("32250", "Jacksonville Beach", 620000, 160, "high", 199, 2, true),
  createZip("32254", "Lackawanna", 260000, 165, "low", 90, 3),
  createZip("32256", "Southside S", 420000, 185, "medium", 139, 3),
  createZip("32257", "Mandarin S", 480000, 175, "medium", 159, 3),
  createZip("32258", "Bartram Park", 420000, 190, "medium", 139, 3),
  createZip("32259", "Bartram Springs", 450000, 185, "medium", 149, 3),
  createZip("32266", "Neptune Beach", 580000, 150, "high", 189, 2),
  createZip("32277", "Regency", 350000, 175, "low", 109, 3),
  
  // NORTH FLORIDA - St. Johns County
  createZip("32080", "St. Augustine Beach", 580000, 155, "high", 189, 2),
  createZip("32081", "Ponte Vedra", 680000, 165, "high", 219, 2, true),
  createZip("32082", "Ponte Vedra Beach", 950000, 150, "high", 279, 1, true),
  createZip("32084", "St. Augustine", 450000, 175, "medium", 149, 3),
  createZip("32086", "St. Augustine S", 420000, 170, "medium", 139, 3),
  createZip("32092", "St. Augustine W", 480000, 180, "medium", 159, 3),
  createZip("32095", "St. Augustine N", 520000, 175, "medium", 169, 3),
  createZip("32259", "World Golf Village", 480000, 175, "medium", 159, 3),
  
  // NORTH FLORIDA - Nassau County
  createZip("32034", "Fernandina Beach", 520000, 155, "medium", 169, 3),
  createZip("32035", "Fernandina Beach S", 480000, 150, "medium", 159, 3),
  createZip("32097", "Yulee", 380000, 175, "medium", 129, 3),
  
  // NORTH FLORIDA - Clay County
  createZip("32003", "Fleming Island", 420000, 175, "medium", 139, 3),
  createZip("32043", "Green Cove Springs", 350000, 165, "low", 109, 3),
  createZip("32065", "Orange Park", 350000, 180, "medium", 119, 3),
  createZip("32068", "Middleburg", 340000, 175, "low", 109, 3),
  createZip("32073", "Orange Park S", 380000, 175, "medium", 129, 3),
  
  // NORTH FLORIDA - Duval Beaches
  createZip("32082", "Ponte Vedra Beach", 950000, 150, "high", 279, 1),
  
  // NORTHWEST FLORIDA - Pensacola
  createZip("32501", "Downtown Pensacola", 350000, 155, "medium", 119, 3),
  createZip("32502", "East Hill", 380000, 160, "medium", 129, 3),
  createZip("32503", "Cordova Park", 420000, 165, "medium", 139, 3),
  createZip("32504", "Pensacola N", 350000, 170, "medium", 119, 3),
  createZip("32505", "Brownsville", 280000, 165, "low", 90, 3),
  createZip("32506", "West Pensacola", 320000, 175, "low", 99, 3),
  createZip("32507", "Pensacola NW", 350000, 170, "medium", 109, 3),
  createZip("32508", "NAS Pensacola", 380000, 145, "medium", 129, 3),
  createZip("32514", "Brent", 350000, 175, "medium", 119, 3),
  createZip("32526", "Ensley", 320000, 170, "low", 99, 3),
  createZip("32534", "Bellview", 340000, 175, "low", 109, 3),
  createZip("32561", "Gulf Breeze", 480000, 155, "medium", 159, 3),
  createZip("32563", "Gulf Breeze E", 520000, 150, "medium", 169, 3),
  createZip("32566", "Navarre", 420000, 175, "medium", 139, 3),
  createZip("32570", "Milton", 350000, 175, "low", 109, 3),
  createZip("32571", "Milton E", 380000, 170, "medium", 129, 3),
  createZip("32583", "Milton N", 360000, 165, "low", 109, 3),
  
  // NORTHWEST FLORIDA - Panama City
  createZip("32401", "Downtown Panama City", 320000, 160, "low", 99, 3),
  createZip("32404", "Panama City E", 350000, 170, "low", 109, 3),
  createZip("32405", "Panama City N", 330000, 165, "low", 99, 3),
  createZip("32407", "Panama City Beach W", 480000, 175, "high", 159, 2),
  createZip("32408", "Panama City Beach", 520000, 185, "high", 169, 2, true),
  createZip("32409", "Panama City NW", 380000, 160, "medium", 129, 3),
  createZip("32413", "Panama City Beach E", 450000, 170, "medium", 149, 3),
  createZip("32438", "Fountain", 280000, 130, "low", 90, 3),
  createZip("32444", "Lynn Haven", 350000, 175, "medium", 119, 3),
  
  // NORTHWEST FLORIDA - Destin/Fort Walton
  createZip("32541", "Destin", 680000, 165, "high", 219, 2, true),
  createZip("32548", "Fort Walton Beach", 420000, 170, "medium", 139, 3),
  createZip("32550", "Miramar Beach", 750000, 155, "high", 239, 2),
  createZip("32569", "Mary Esther", 380000, 160, "medium", 129, 3),
  createZip("32578", "Niceville", 420000, 175, "medium", 139, 3),
  createZip("32579", "Shalimar", 450000, 165, "medium", 149, 3),
  createZip("32580", "Valparaiso", 380000, 160, "medium", 129, 3),
  
  // NORTHWEST FLORIDA - 30A Corridor
  createZip("32459", "Santa Rosa Beach", 850000, 145, "high", 269, 2, true),
  createZip("32461", "Inlet Beach", 920000, 135, "high", 289, 1),
  
  // NORTH CENTRAL FLORIDA - Gainesville
  createZip("32601", "Downtown Gainesville", 320000, 165, "medium", 99, 3),
  createZip("32603", "University Area", 280000, 175, "low", 90, 3),
  createZip("32605", "Gainesville NW", 350000, 170, "medium", 119, 3),
  createZip("32606", "Gainesville W", 380000, 165, "medium", 129, 3),
  createZip("32607", "Gainesville SW", 420000, 175, "medium", 139, 3),
  createZip("32608", "Haile Plantation", 450000, 165, "medium", 149, 3),
  createZip("32609", "Gainesville N", 320000, 170, "low", 99, 3),
  createZip("32612", "UF Campus", 380000, 155, "medium", 129, 3),
  createZip("32614", "Gainesville E", 350000, 165, "low", 109, 3),
  createZip("32615", "Alachua", 380000, 160, "medium", 129, 3),
  createZip("32618", "Archer", 290000, 130, "low", 90, 3),
  createZip("32653", "Gainesville NE", 420000, 170, "medium", 139, 3),
  
  // NORTH CENTRAL FLORIDA - Ocala
  createZip("34470", "Ocala E", 320000, 165, "low", 99, 3),
  createZip("34471", "Downtown Ocala", 350000, 170, "low", 109, 3),
  createZip("34472", "Ocala SE", 340000, 175, "low", 109, 3),
  createZip("34473", "Ocala SW", 290000, 180, "low", 90, 3),
  createZip("34474", "Ocala W", 350000, 175, "low", 109, 3),
  createZip("34475", "Ocala NW", 380000, 165, "medium", 129, 3),
  createZip("34476", "Ocala S", 320000, 185, "low", 99, 3),
  createZip("34479", "Silver Springs", 340000, 155, "low", 109, 3),
  createZip("34480", "Ocala N", 360000, 175, "medium", 119, 3),
  createZip("34481", "On Top of the World", 320000, 175, "medium", 99, 3),
  createZip("34482", "Ocala NW", 420000, 165, "medium", 139, 3),
  
  // FLORIDA KEYS
  createZip("33037", "Key Largo", 680000, 135, "high", 219, 2),
  createZip("33040", "Key West", 850000, 145, "high", 269, 1, true),
  createZip("33042", "Summerland Key", 620000, 115, "medium", 199, 3),
  createZip("33043", "Big Pine Key", 580000, 120, "medium", 189, 3),
  createZip("33050", "Marathon", 620000, 130, "medium", 199, 3),
  createZip("33051", "Marathon Shores", 580000, 125, "medium", 189, 3),
  createZip("33070", "Tavernier", 620000, 130, "medium", 199, 3),
  createZip("33036", "Islamorada", 780000, 125, "high", 249, 2, true),
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
  const [activeTab, setActiveTab] = useState("zip-codes")
  const [selectedZip, setSelectedZip] = useState<ZipCodeListing | null>(null)
  const [selectedVA, setSelectedVA] = useState<VAPackage | null>(null)
  const [selectedProduct, setSelectedProduct] = useState<PhysicalProduct | null>(null)
  const [customizeProduct, setCustomizeProduct] = useState<PhysicalProduct | null>(null)
  const [cart, setCart] = useState<(ZipCodeListing | VAPackage | PhysicalProduct)[]>([])
  const [activeMarket, setActiveMarket] = useState<"all" | "high" | "medium" | "low">("all")
  const [zipSearch, setZipSearch] = useState("")
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

  const filteredZips = ZIP_CODE_LISTINGS.filter((z) => {
    const matchesMarket = activeMarket === "all" || z.marketDemand === activeMarket
    const matchesSearch = zipSearch === "" || 
      z.area.toLowerCase().includes(zipSearch.toLowerCase()) ||
      z.zipCode.includes(zipSearch)
    return matchesMarket && matchesSearch
  })

  const cartTotal = cart.reduce((sum, item) => sum + (item as any).price, 0)

  const handleAddToCart = (item: any, type: string) => {
    setCart([...cart, item])
    const name = item.name || `${item.zipCode} - ${item.area}` || "Item"
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
          <TabsTrigger value="zip-codes">Zip Codes</TabsTrigger>
          <TabsTrigger value="va">Virtual Assistants</TabsTrigger>
          <TabsTrigger value="physical">Physical Materials</TabsTrigger>
        </TabsList>

{/* ZIP CODES TAB */}
  <TabsContent value="zip-codes" className="space-y-6 mt-8">
  <div className="flex flex-col md:flex-row gap-4 justify-between">
  <div>
    <h2 className="text-2xl font-bold text-white">Exclusive Territories</h2>
    <p className="text-slate-400 text-sm mt-1">{filteredZips.length} zip codes available across Florida</p>
  </div>
  <div className="relative w-full md:w-80">
    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
    <Input
      placeholder="Search by city or zip code..."
      value={zipSearch}
      onChange={(e) => setZipSearch(e.target.value)}
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
      All ({ZIP_CODE_LISTINGS.length})
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

  {filteredZips.length === 0 && zipSearch ? (
          <Card className="p-6 bg-white/5 border-red-500/30">
            <div className="flex items-start gap-4">
              <div className="relative h-32 w-32 rounded-lg overflow-hidden flex-shrink-0 bg-gradient-to-br from-red-500/20 to-red-900/20 flex items-center justify-center">
                <MapPin className="h-12 w-12 text-red-400" />
              </div>
              <div className="flex-1">
                <Badge className="bg-red-500/20 text-red-400 border-red-500/30 mb-2">Territory Claimed</Badge>
                <h3 className="text-xl font-bold text-white mb-1">{zipSearch}</h3>
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
                  <Button variant="outline" size="sm" onClick={() => { setZipSearch(""); setActiveMarket("all"); }}>
                    Browse Available Areas
                  </Button>
                  <Button variant="outline" size="sm" className="border-primary/30 text-primary hover:bg-primary/10">
                    Join Waitlist
                  </Button>
                </div>
              </div>
            </div>
          </Card>
        ) : filteredZips.length === 0 ? (
          <div className="text-center py-12">
            <MapPin className="h-12 w-12 mx-auto text-slate-500 mb-4" />
            <h3 className="text-lg font-semibold text-white mb-2">No zip codes found</h3>
            <p className="text-slate-400">Try adjusting your search or filter criteria</p>
            <Button variant="outline" className="mt-4" onClick={() => { setZipSearch(""); setActiveMarket("all"); }}>
              Clear Filters
            </Button>
          </div>
        ) : (
  <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {filteredZips.map((zip) => (
                  <Card
                    key={zip.id}
                    className={`group relative overflow-hidden transition-all duration-300 hover:scale-105 flex flex-col ${
                      zip.popular ? "ring-2 ring-primary/50 shadow-lg shadow-primary/20" : ""
                    }`}
                  >
                    {/* Image */}
                    <div className="relative h-40 overflow-hidden">
                      <img 
                        src={zip.image} 
                        alt={`${zip.area}, ${zip.state}`}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                      
                      {zip.popular && (
                        <Badge className="absolute top-3 right-3 bg-primary text-white z-10">Premium</Badge>
                      )}

                      <Badge
                        variant="outline"
                        className={`absolute top-3 left-3 z-10 border ${getDemandColor(zip.marketDemand)}`}
                      >
                        {zip.marketDemand === "high" && <TrendingUp className="h-3 w-3 mr-1" />}
                        {zip.marketDemand.charAt(0).toUpperCase() + zip.marketDemand.slice(1)}
                      </Badge>

                      <div className="absolute bottom-3 left-4">
                        <div className="text-3xl font-bold text-white drop-shadow-lg">{zip.zipCode}</div>
                      </div>
                    </div>

                    <div className="relative flex-1 p-5 space-y-4 flex flex-col">
                      <div className="space-y-1">
                        <p className="text-lg font-semibold text-primary">{zip.area}</p>
                        <p className="text-sm text-slate-400">{zip.state}</p>
                      </div>

<div className="space-y-2 bg-white/5 rounded-lg p-3">
  <div className="flex justify-between items-center text-sm">
  <span className="text-slate-400">Avg Home Price</span>
  <span className="text-white font-semibold">${(zip.avgHomePrice / 1000000).toFixed(1)}M</span>
  </div>
  <div className="flex justify-between items-center text-sm">
  <span className="text-slate-400">Leads/Month</span>
  <span className="text-primary font-semibold">{zip.monthlyLeads}+</span>
  </div>
  <div className="flex justify-between items-center text-sm pt-2 border-t border-white/10">
  <span className="text-slate-400">Spots Available</span>
  <div className="flex items-center gap-1.5">
    {[...Array(zip.totalSpots)].map((_, i) => (
      <div 
        key={i} 
        className={`w-2.5 h-2.5 rounded-full ${i < zip.spotsAvailable ? 'bg-emerald-500' : 'bg-slate-600'}`}
      />
    ))}
    <span className={`ml-1 font-semibold ${zip.spotsAvailable === 0 ? 'text-red-400' : zip.spotsAvailable === 1 ? 'text-amber-400' : 'text-emerald-400'}`}>
      {zip.spotsAvailable}/{zip.totalSpots}
    </span>
  </div>
  </div>
  </div>

                      <div className="space-y-3 mt-auto pt-3 border-t border-white/10">
                        <div className="flex items-baseline gap-1">
                          <span className="text-2xl font-bold text-white">${zip.price}</span>
                          <span className="text-sm text-slate-400">/mo</span>
                        </div>
                        {zip.spotsAvailable === 0 ? (
                          <Button className="w-full" variant="outline" disabled>
                            Sold Out
                          </Button>
                        ) : (
                          <Button
                            className="w-full"
                            onClick={() => {
                              handleAddToCart(zip, "zip")
                              setSelectedZip(zip)
                            }}
                          >
                            <ShoppingCart className="h-4 w-4 mr-2" />
                            {zip.spotsAvailable === 1 ? "Last Spot!" : "Claim Spot"}
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
                <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                {pkg.popular && (
                  <Badge className="absolute top-4 right-4 bg-primary text-white z-10">Popular</Badge>
                )}

                <div className="relative flex-1 p-6 space-y-6 flex flex-col">
                  <div className="space-y-2">
                    <p className="text-lg font-bold text-white">{pkg.name}</p>
                    <p className="text-sm text-slate-400">{pkg.hours} hours/month</p>
                  </div>

                  <div className="space-y-3 bg-white/5 rounded-lg p-4">
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
                      <p className="text-sm text-slate-400">${pkg.hourlyRate}/hr ({pkg.hours}hrs)</p>
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
                <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                {product.popular && (
                  <Badge className="absolute top-4 right-4 bg-primary text-white z-10">Popular</Badge>
                )}

                <Badge variant="outline" className="absolute top-4 left-4 bg-black/50 backdrop-blur-sm border-white/20 text-white z-10 capitalize">
                  {product.category}
                </Badge>

                <div className="relative flex-1 p-6 space-y-6 flex flex-col">
                  <div className="space-y-2">
                    <p className="text-lg font-bold text-white">{product.name}</p>
                    <p className="text-sm text-slate-400">{product.description}</p>
                  </div>

                  <div className="space-y-2 bg-white/5 rounded-lg p-4">
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
