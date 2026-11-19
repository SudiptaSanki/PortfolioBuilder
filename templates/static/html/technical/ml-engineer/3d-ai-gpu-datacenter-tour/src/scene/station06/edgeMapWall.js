// edgeMapWall.js — the Map Wall (Station 06's HERO): a curved,
// panelled LED video wall across the east end of the Observatory —
// framed panels with visible bezels, the way real NOC walls are built,
// carrying an equirectangular world map in dim slate (mapLand) on a
// near-black ocean. One physical LED stud per edge city — 330+ of
// them, at real coordinates, instanced as a single mesh; the great
// hubs get name plates; ONE stud burns amber (a degraded PoP, the map
// telling the truth). Routes between hubs are drawn ON the map surface
// — nothing flies through the room, nothing rotates, the Earth here is
// a wall. Wall furniture: the title plate, the dual clock (LOCAL /
// UTC — the NOC signature), and the scale plate.

import * as THREE from 'three';
import { STATION06, PALETTE, seeded } from '../../config/world.js';

const S06 = STATION06;
const MW = S06.mapWall;
const BETA_MAX = Math.asin(MW.zSpan / MW.radius);

// ------------------------------------------------------------- cities ---
// Edge points of presence at real coordinates (name, lat, lon) — the
// Cloudflare-scale edge: 330+ cities. Hubs get name plates and larger
// studs; Recife is the one degraded PoP and burns amber.
const HUBS = new Set(['London', 'Ashburn', 'Frankfurt', 'Singapore', 'São Paulo', 'Tokyo', 'Sydney', 'Mumbai']);
export const AMBER_POP = { name: 'Recife', lat: -8.05, lon: -34.9 };

const CITIES = [
  // North America
  ['Anchorage', 61.2, -149.9], ['Honolulu', 21.3, -157.8], ['Vancouver', 49.3, -123.1],
  ['Calgary', 51.0, -114.1], ['Edmonton', 53.5, -113.5], ['Winnipeg', 49.9, -97.1],
  ['Toronto', 43.7, -79.4], ['Montreal', 45.5, -73.6], ['Ottawa', 45.4, -75.7],
  ['Quebec City', 46.8, -71.2], ['Halifax', 44.6, -63.6], ['Saskatoon', 52.1, -106.7],
  ['Regina', 50.4, -104.6], ['Kelowna', 49.9, -119.5], ['Seattle', 47.6, -122.3],
  ['Portland', 45.5, -122.7], ['San Francisco', 37.8, -122.4], ['San Jose', 37.3, -121.9],
  ['Los Angeles', 34.1, -118.2], ['San Diego', 32.7, -117.2], ['Las Vegas', 36.2, -115.1],
  ['Phoenix', 33.4, -112.1], ['Salt Lake City', 40.8, -111.9], ['Denver', 39.7, -105.0],
  ['Albuquerque', 35.1, -106.7], ['Dallas', 32.8, -96.8], ['Houston', 29.8, -95.4],
  ['Austin', 30.3, -97.7], ['San Antonio', 29.4, -98.5], ['Oklahoma City', 35.5, -97.5],
  ['Kansas City', 39.1, -94.6], ['Minneapolis', 45.0, -93.3], ['Chicago', 41.9, -87.6],
  ['St Louis', 38.6, -90.2], ['Memphis', 35.1, -90.0], ['Nashville', 36.2, -86.8],
  ['Atlanta', 33.7, -84.4], ['Charlotte', 35.2, -80.8], ['Jacksonville', 30.3, -81.7],
  ['Orlando', 28.5, -81.4], ['Miami', 25.8, -80.2], ['Tampa', 28.0, -82.5],
  ['New Orleans', 30.0, -90.1], ['Indianapolis', 39.8, -86.2], ['Columbus', 40.0, -83.0],
  ['Cincinnati', 39.1, -84.5], ['Pittsburgh', 40.4, -80.0], ['Cleveland', 41.5, -81.7],
  ['Detroit', 42.3, -83.0], ['Buffalo', 42.9, -78.9], ['Boston', 42.4, -71.1],
  ['New York', 40.7, -74.0], ['Philadelphia', 39.9, -75.2], ['Baltimore', 39.3, -76.6],
  ['Ashburn', 39.0, -77.5], ['Richmond', 37.5, -77.5], ['Raleigh', 35.8, -78.6],
  ['Louisville', 38.3, -85.8], ['Milwaukee', 43.0, -87.9], ['Omaha', 41.3, -96.0],
  ['Des Moines', 41.6, -93.6], ['Wichita', 37.7, -97.3], ['Tulsa', 36.2, -96.0],
  ['Little Rock', 34.7, -92.3], ['Birmingham', 33.5, -86.8], ['Jackson', 32.3, -90.2],
  ['Billings', 45.8, -108.5], ['Boise', 43.6, -116.2], ['Spokane', 47.7, -117.4],
  ['Reno', 39.5, -119.8], ['Sacramento', 38.6, -121.5], ['Fresno', 36.7, -119.8],
  ['Tucson', 32.2, -110.9], ['El Paso', 31.8, -106.5],
  // Latin America & the Caribbean
  ['Mexico City', 19.4, -99.1], ['Guadalajara', 20.7, -103.3], ['Monterrey', 25.7, -100.3],
  ['Tijuana', 32.5, -117.0], ['Cancun', 21.2, -86.8], ['Merida', 21.0, -89.6],
  ['Guatemala City', 14.6, -90.5], ['San Salvador', 13.7, -89.2], ['Managua', 12.1, -86.3],
  ['San Jose CR', 9.9, -84.1], ['Panama City', 9.0, -79.5], ['Havana', 23.1, -82.4],
  ['Santo Domingo', 18.5, -69.9], ['San Juan', 18.5, -66.1], ['Kingston', 18.0, -76.8],
  ['Bogota', 4.7, -74.1], ['Medellin', 6.2, -75.6], ['Cali', 3.4, -76.5],
  ['Quito', -0.2, -78.5], ['Guayaquil', -2.2, -79.9], ['Lima', -12.0, -77.0],
  ['Santiago', -33.4, -70.7], ['Valparaiso', -33.0, -71.6], ['Buenos Aires', -34.6, -58.4],
  ['Cordoba', -31.4, -64.2], ['Rosario', -32.9, -60.7], ['Montevideo', -34.9, -56.2],
  ['Asuncion', -25.3, -57.6], ['La Paz', -16.5, -68.1], ['São Paulo', -23.6, -46.6],
  ['Rio de Janeiro', -22.9, -43.2], ['Brasilia', -15.8, -47.9], ['Belo Horizonte', -19.9, -43.9],
  ['Salvador', -12.9, -38.5], ['Recife', -8.1, -34.9], ['Fortaleza', -3.7, -38.5],
  ['Porto Alegre', -30.0, -51.2], ['Curitiba', -25.4, -49.3], ['Manaus', -3.1, -60.0],
  // Europe
  ['Reykjavik', 64.1, -21.9], ['Dublin', 53.3, -6.3], ['Belfast', 54.6, -5.9],
  ['London', 51.5, -0.1], ['Manchester', 53.5, -2.2], ['Edinburgh', 55.9, -3.2],
  ['Amsterdam', 52.4, 4.9], ['Rotterdam', 51.9, 4.5], ['Brussels', 50.8, 4.4],
  ['Paris', 48.9, 2.4], ['Luxembourg', 49.6, 6.1], ['Frankfurt', 50.1, 8.7],
  ['Munich', 48.1, 11.6], ['Berlin', 52.5, 13.4], ['Hamburg', 53.6, 10.0],
  ['Cologne', 50.9, 7.0], ['Dusseldorf', 51.2, 6.8], ['Stuttgart', 48.8, 9.2],
  ['Nuremberg', 49.5, 11.1], ['Leipzig', 51.3, 12.4], ['Hanover', 52.4, 9.7],
  ['Bremen', 53.1, 8.8], ['Zurich', 47.4, 8.5], ['Geneva', 46.2, 6.1],
  ['Vienna', 48.2, 16.4], ['Prague', 50.1, 14.4], ['Warsaw', 52.2, 21.0],
  ['Krakow', 50.1, 19.9], ['Gdansk', 54.4, 18.6], ['Budapest', 47.5, 19.0],
  ['Bratislava', 48.1, 17.1], ['Ljubljana', 46.1, 14.5], ['Zagreb', 45.8, 16.0],
  ['Belgrade', 44.8, 20.5], ['Bucharest', 44.4, 26.1], ['Sofia', 42.7, 23.3],
  ['Athens', 38.0, 23.7], ['Thessaloniki', 40.6, 22.9], ['Istanbul', 41.0, 29.0],
  ['Madrid', 40.4, -3.7], ['Barcelona', 41.4, 2.2], ['Valencia', 39.5, -0.4],
  ['Lisbon', 38.7, -9.1], ['Porto', 41.2, -8.6], ['Milan', 45.5, 9.2],
  ['Rome', 41.9, 12.5], ['Turin', 45.1, 7.7], ['Venice', 45.4, 12.3],
  ['Naples', 40.8, 14.3], ['Palermo', 38.1, 13.4], ['Marseille', 43.3, 5.4],
  ['Lyon', 45.8, 4.8], ['Bordeaux', 44.8, -0.6], ['Nantes', 47.2, -1.6],
  ['Lille', 50.6, 3.1], ['Strasbourg', 48.6, 7.8], ['Copenhagen', 55.7, 12.6],
  ['Oslo', 59.9, 10.7], ['Stockholm', 59.3, 18.1], ['Gothenburg', 57.7, 11.9],
  ['Malmo', 55.6, 13.0], ['Helsinki', 60.2, 24.9], ['Tallinn', 59.4, 24.7],
  ['Riga', 56.9, 24.1], ['Vilnius', 54.7, 25.3], ['Minsk', 53.9, 27.6],
  ['Kyiv', 50.4, 30.5], ['Lviv', 49.8, 24.0], ['Chisinau', 47.0, 28.9],
  ['Sarajevo', 43.9, 18.4], ['Skopje', 42.0, 21.4], ['Tirana', 41.3, 19.8],
  ['Podgorica', 42.4, 19.3], ['Valletta', 35.9, 14.5], ['Nicosia', 35.2, 33.4],
  ['Ankara', 39.9, 32.9], ['Izmir', 38.4, 27.1],
  // Middle East & Africa
  ['Cairo', 30.0, 31.2], ['Alexandria', 31.2, 29.9], ['Tunis', 36.8, 10.2],
  ['Algiers', 36.8, 3.1], ['Casablanca', 33.6, -7.6], ['Rabat', 34.0, -6.8],
  ['Dakar', 14.7, -17.4], ['Accra', 5.6, -0.2], ['Lagos', 6.5, 3.4],
  ['Abidjan', 5.3, -4.0], ['Luanda', -8.8, 13.2], ['Kinshasa', -4.3, 15.3],
  ['Libreville', 0.4, 9.4], ['Yaounde', 3.9, 11.5], ['Brazzaville', -4.3, 15.2],
  ['Bamako', 12.6, -8.0], ['Ouagadougou', 12.4, -1.5], ['Niamey', 13.5, 2.1],
  ['Nairobi', -1.3, 36.8], ['Mombasa', -4.1, 39.7], ['Dar es Salaam', -6.8, 39.3],
  ['Kampala', 0.3, 32.6], ['Addis Ababa', 9.0, 38.7], ['Djibouti', 11.6, 43.1],
  ['Mogadishu', 2.0, 45.3], ['Khartoum', 15.6, 32.5], ['Juba', 4.9, 31.6],
  ['Antananarivo', -18.9, 47.5], ['Maputo', -25.9, 32.6], ['Harare', -17.8, 31.0],
  ['Lusaka', -15.4, 28.3], ['Johannesburg', -26.2, 28.0], ['Cape Town', -33.9, 18.4],
  ['Durban', -29.9, 31.0], ['Windhoek', -22.6, 17.1], ['Gaborone', -24.6, 25.9],
  ['Blantyre', -15.8, 35.0], ['Bulawayo', -20.2, 28.6], ['Walvis Bay', -23.0, 14.5],
  ['Port Louis', -20.2, 57.5], ['Victoria', -4.6, 55.5], ['Saint-Denis', -20.9, 55.5],
  ['Riyadh', 24.6, 46.7], ['Jeddah', 21.5, 39.2], ['Doha', 25.3, 51.5],
  ['Dubai', 25.2, 55.3], ['Abu Dhabi', 24.5, 54.4], ['Muscat', 23.6, 58.4],
  ['Kuwait City', 29.4, 48.0], ['Manama', 26.2, 50.6], ['Baghdad', 33.3, 44.4],
  ['Tehran', 35.7, 51.4], ['Tel Aviv', 32.1, 34.8], ['Amman', 31.9, 35.9],
  ['Beirut', 33.9, 35.5], ['Damascus', 33.5, 36.3],
  // Asia-Pacific
  ['Mumbai', 19.1, 72.9], ['Delhi', 28.6, 77.2], ['Bangalore', 13.0, 77.6],
  ['Chennai', 13.1, 80.3], ['Hyderabad', 17.4, 78.5], ['Kolkata', 22.6, 88.4],
  ['Pune', 18.5, 73.9], ['Ahmedabad', 23.0, 72.6], ['Jaipur', 26.9, 75.8],
  ['Lucknow', 26.8, 80.9], ['Kochi', 10.0, 76.3], ['Guwahati', 26.1, 91.7],
  ['Surat', 21.2, 72.8], ['Indore', 22.7, 75.9], ['Nagpur', 21.1, 79.1],
  ['Coimbatore', 11.0, 76.9], ['Visakhapatnam', 17.7, 83.3], ['Bhubaneswar', 20.3, 85.8],
  ['Patna', 25.6, 85.1], ['Ranchi', 23.3, 85.3], ['Dehradun', 30.3, 78.0],
  ['Peshawar', 34.0, 71.6], ['Multan', 30.2, 71.5], ['Dhaka', 23.8, 90.4],
  ['Kathmandu', 27.7, 85.3], ['Colombo', 6.9, 79.9], ['Male', 4.2, 73.5],
  ['Karachi', 24.9, 67.0], ['Lahore', 31.5, 74.3], ['Islamabad', 33.7, 73.1],
  ['Kabul', 34.5, 69.2], ['Almaty', 43.2, 76.9], ['Tashkent', 41.3, 69.2],
  ['Bangkok', 13.8, 100.5], ['Chiang Mai', 18.8, 99.0], ['Kuala Lumpur', 3.1, 101.7],
  ['Singapore', 1.4, 103.8], ['Jakarta', -6.2, 106.8], ['Surabaya', -7.2, 112.7],
  ['Denpasar', -8.7, 115.2], ['Manila', 14.6, 121.0], ['Cebu', 10.3, 123.9],
  ['Ho Chi Minh City', 10.8, 106.6], ['Hanoi', 21.0, 105.8], ['Phnom Penh', 11.6, 104.9],
  ['Yangon', 16.8, 96.2], ['Vientiane', 18.0, 102.6], ['Bandar Seri Begawan', 4.9, 114.9],
  ['Hong Kong', 22.3, 114.2], ['Taipei', 25.0, 121.6], ['Kaohsiung', 22.6, 120.3],
  ['Guangzhou', 23.1, 113.3], ['Shenzhen', 22.5, 114.1], ['Shanghai', 31.2, 121.5],
  ['Beijing', 39.9, 116.4], ['Chengdu', 30.7, 104.1], ['Wuhan', 30.6, 114.3],
  ['Xian', 34.3, 108.9], ['Nanjing', 32.1, 118.8], ['Hangzhou', 30.3, 120.2],
  ['Chongqing', 29.6, 106.5], ['Tianjin', 39.1, 117.2], ['Shenyang', 41.8, 123.4],
  ['Harbin', 45.8, 126.5], ['Urumqi', 43.8, 87.6], ['Seoul', 37.6, 127.0],
  ['Busan', 35.2, 129.1], ['Tokyo', 35.7, 139.7], ['Osaka', 34.7, 135.5],
  ['Nagoya', 35.2, 136.9], ['Fukuoka', 33.6, 130.4], ['Sapporo', 43.1, 141.3],
  ['Sydney', -33.9, 151.2], ['Melbourne', -37.8, 145.0], ['Brisbane', -27.5, 153.0],
  ['Perth', -31.9, 115.9], ['Adelaide', -34.9, 138.6], ['Canberra', -35.3, 149.1],
  ['Darwin', -12.5, 130.8], ['Hobart', -42.9, 147.3], ['Auckland', -36.8, 174.8],
  ['Wellington', -41.3, 174.8], ['Christchurch', -43.5, 172.6], ['Noumea', -22.3, 166.5],
  ['Suva', -18.1, 178.4], ['Port Moresby', -9.5, 147.2], ['Guam', 13.4, 144.8],
  ['Ulaanbaatar', 47.9, 106.9], ['Novosibirsk', 55.0, 82.9], ['Vladivostok', 43.1, 131.9],
  ['Yekaterinburg', 56.8, 60.6], ['Moscow', 55.8, 37.6], ['St Petersburg', 59.9, 30.3],
  ['Kazan', 55.8, 49.1], ['Samara', 53.2, 50.2], ['Krasnoyarsk', 56.0, 92.9],
  ['Irkutsk', 52.3, 104.3],
];

// --------------------------------------------------------- landmasses ---
// Simplified coastline polygons ([lon, lat] rings) — a compact dataset
// drawn once into the map texture. Coarse at reading distance, honest
// in outline: the continents are where the cities say they are.
const LAND = [
  // North America + Central America
  [[-168, 65], [-161, 70], [-152, 71], [-141, 70], [-134, 69], [-125, 71], [-117, 69], [-108, 68], [-100, 69], [-95, 69], [-90, 69], [-85, 66], [-82, 66], [-81, 62], [-79, 58], [-80, 55], [-84, 52], [-89, 51], [-92, 49], [-89, 48], [-84, 46], [-79, 43.5], [-76, 43], [-71, 41], [-74, 39], [-75.5, 37], [-76, 35], [-79, 33], [-81, 30], [-81, 25.5], [-82.5, 28], [-84, 30], [-87, 30], [-89, 29], [-92, 29], [-95, 28.5], [-97, 26], [-97, 24], [-97, 20], [-94, 18.5], [-91, 18.5], [-88, 21.5], [-87, 21], [-86.5, 15], [-83, 15], [-83, 9], [-79.5, 9], [-78, 7.5], [-80.5, 9.5], [-82, 9.5], [-84, 12], [-86, 13], [-89, 14], [-92, 14.5], [-95, 15.5], [-97, 16], [-100, 17.5], [-103, 19], [-105, 20.5], [-107.5, 23], [-109.5, 23.5], [-110.5, 25], [-112, 29], [-114, 31], [-116.5, 32.5], [-119, 34], [-121, 35], [-122.5, 37.5], [-124, 40], [-124, 46], [-123, 48.5], [-126, 50], [-130, 53], [-133, 56], [-137, 58.5], [-143, 60], [-148, 61], [-152, 58.5], [-156, 57], [-160, 55.5], [-162, 58.5], [-164, 60], [-166, 61.5], [-168, 65]],
  // Greenland
  [[-45, 59.5], [-42, 60], [-40, 63], [-37, 65.5], [-32, 68], [-29, 68.5], [-22, 70], [-20, 73], [-22, 76], [-28, 78], [-38, 79.5], [-50, 79], [-58, 77], [-56, 73], [-54, 70], [-53, 66], [-53.5, 62], [-50, 60], [-45, 59.5]],
  // South America
  [[-78, 7.5], [-75.5, 10.5], [-72, 12], [-68, 11], [-64, 10.5], [-60, 8.5], [-55, 6], [-52, 5], [-50, 1.5], [-48, 0], [-44, -2.5], [-40, -5], [-35, -7.5], [-35, -9.5], [-38, -13], [-39, -15], [-39.5, -18], [-40.5, -21.5], [-43, -23], [-48, -26], [-52, -28.5], [-53.5, -33], [-57, -35], [-58.5, -38], [-62, -39], [-62.5, -40.5], [-65, -41], [-65, -43.5], [-65.5, -45.5], [-67.5, -48], [-67.5, -50], [-69, -52], [-68.5, -54.5], [-70, -54], [-71.5, -54], [-73.5, -51], [-74, -48], [-73.5, -44], [-73.5, -40], [-73, -37], [-71.5, -33], [-70, -30], [-70, -25], [-70, -20], [-70.2, -18.3], [-72, -17.5], [-75, -15], [-77, -12], [-79, -8], [-80.5, -5.5], [-81, -3.5], [-80.5, -0.5], [-79.5, 1.5], [-77.5, 3.5], [-77, 6], [-78, 7.5]],
  // Africa
  [[-6, 35], [-9.5, 31], [-13, 27.5], [-16, 23.5], [-16.5, 20], [-17, 15], [-16.5, 12], [-13.5, 8], [-13, 7.5], [-8, 5], [-4.5, 5.2], [0, 6], [4, 6], [6.5, 4.3], [9.2, 3.8], [9.3, 0.5], [11, -1.5], [13, -6], [12.2, -12], [12.8, -16], [13.5, -20], [14.3, -23], [15, -27], [16.5, -29], [17.5, -32], [18.5, -33.5], [20, -34.8], [24, -34], [27, -33.5], [29.5, -31.5], [31.5, -29.5], [32.5, -27.5], [35, -24.5], [35.5, -21], [36, -17.5], [38, -15], [40, -11], [40.3, -7], [40.8, -4], [41.5, -1.5], [45, 1], [48, 4.5], [51, 10.5], [51.2, 12], [47, 11.5], [43.5, 11.8], [42, 13.5], [40, 15.5], [38.5, 18], [37, 21.5], [35.5, 23.5], [34, 27], [33.5, 29.5], [34.2, 28], [32.3, 31.2], [30, 31.4], [26, 31.8], [22, 33], [17, 32.8], [13, 32.4], [11.2, 33.9], [10.2, 36.8], [6.5, 36.9], [3, 36.8], [-1, 35.8], [-5.5, 35.9], [-6, 35]],
  // Madagascar
  [[44, -16.5], [46, -15], [48.5, -14], [50, -16], [49.5, -18.5], [48, -21], [47, -24], [45.5, -25.3], [44.5, -24.5], [43.8, -21.5], [43.3, -18], [44, -16.5]],
  // Eurasia — Atlantic coast, Arctic coast, Pacific coast, SE Asia,
  // India, Arabia, the Levant, Anatolia, the Mediterranean, closed.
  [[-9.5, 37], [-8.9, 38.5], [-9.3, 43], [-7.5, 43.8], [-3.8, 43.8], [-1.8, 43.5], [-1.2, 45.7], [-1.8, 46.5], [-2.2, 48.7], [-4.8, 48.4], [-1.9, 49.7], [-0.5, 50.8], [1.5, 51], [3.3, 51.4], [5, 53.3], [6.8, 53.4], [8.1, 54], [8.3, 55.2], [8.6, 57], [7.5, 58.2], [5.5, 59], [5, 60.3], [6.5, 62], [10.5, 63.5], [13.5, 65.5], [17, 66.5], [20, 68.5], [24, 70.5], [30, 70.5], [38, 69], [46, 68], [54, 68.5], [62, 69.5], [70, 70], [78, 71.5], [85, 73], [92, 74.5], [100, 76.5], [108, 77], [115, 75.5], [122, 73.5], [130, 72], [138, 72], [146, 72], [154, 71], [160, 69.5], [166, 65.5], [172, 65], [178, 64.8], [179, 62], [173, 60], [166, 60], [160, 56], [156.5, 51], [156.8, 50.8], [152, 46], [148, 44], [143, 42.5], [141.8, 41], [141, 39], [140, 36.5], [139, 35], [137, 34.8], [135.5, 34.3], [133, 34], [130.5, 33.5], [129.5, 32.5], [127.5, 31], [124, 29], [122, 28], [121.2, 25.2], [120.2, 24], [119, 22.8], [116, 23.3], [113, 22], [110, 20.2], [108.2, 17.5], [107, 15], [106.8, 10.5], [104.8, 8.8], [103.5, 6.5], [101.5, 5.5], [100.3, 7], [99, 9], [98.5, 11.5], [97.8, 15], [96, 16.5], [94.5, 17.5], [92.3, 16], [91, 18.5], [90.5, 21.8], [89, 22], [87.5, 21.5], [86.4, 20.2], [84, 19], [82.3, 16.5], [81, 15.5], [80.3, 14], [79.8, 10.5], [78.2, 9], [77, 8.2], [76.2, 10], [74.8, 13], [73.5, 15.8], [72.8, 18.5], [72.6, 20.5], [71, 21.5], [69.8, 22.2], [68.2, 23], [66.5, 25.2], [63, 25.2], [61.5, 25.2], [59, 25.5], [57.8, 26.5], [56.5, 27], [54, 26.5], [51.5, 25], [50, 26.8], [48.8, 30], [49.5, 28.5], [50, 26], [51.5, 24.3], [53, 24.2], [55, 24.5], [56.5, 24.8], [58, 23.5], [59.5, 22.5], [59.8, 22.2], [57.8, 19.5], [56.2, 18], [55.2, 17], [52.5, 15.5], [49, 13.5], [45, 12.7], [43.5, 12], [42.5, 13.5], [41, 16], [39.5, 20], [37.5, 23], [35.5, 26], [34.5, 28], [34.3, 29.5], [35.8, 31.5], [36, 33.5], [35.9, 36.3], [33.5, 36], [31.5, 36.2], [30.5, 36.3], [29, 36.5], [27.5, 36.8], [26.2, 38.3], [24, 37.5], [23, 36.5], [22.5, 37], [22.4, 36.8], [21.7, 38], [20.5, 39.8], [19.5, 40.2], [19.4, 42], [18.5, 40.3], [16, 38.2], [15.7, 40], [14.5, 40.8], [13.8, 41.2], [12.5, 42], [13.5, 43.5], [12.3, 45.5], [13.6, 45.6], [14.5, 45.2], [13.8, 44.5], [12, 44], [10.2, 44], [8.9, 44.3], [8, 44], [7.5, 43.6], [6.1, 43.1], [3.2, 42.4], [3, 41.8], [2.2, 41.3], [1.5, 40.5], [0.3, 39.5], [-0.3, 39.5], [-0.5, 38.2], [-1.2, 37.6], [-2.2, 36.7], [-4.4, 36.7], [-5.4, 35.9], [-5.9, 35.8], [-6.3, 35], [-8, 33], [-8.8, 31], [-9.6, 29], [-9.8, 31.5], [-8.9, 33], [-8.8, 35], [-9.5, 37]],
  // Britain & Ireland
  [[-5.7, 50.1], [-3.5, 50.7], [-1.8, 50.8], [-0.9, 50.8], [1.4, 51.2], [1.3, 52.5], [0.5, 52.9], [-0.5, 54.5], [-1.5, 55.5], [-2.2, 57.6], [-4, 58.6], [-5.1, 58.3], [-6.3, 57.2], [-7.5, 57.3], [-6.8, 56.5], [-5.7, 55.3], [-4.8, 54.9], [-3.1, 53.4], [-4.6, 53.3], [-5.3, 51.9], [-5.2, 51.6], [-3.8, 51.6], [-4.9, 50.3], [-5.7, 50.1]],
  [[-10.4, 51.8], [-8.3, 51.6], [-6.2, 52.2], [-6, 53.4], [-5.6, 54.4], [-7.3, 55.2], [-9.8, 55.1], [-10.1, 54.2], [-10.4, 53.5], [-9.8, 52.5], [-10.4, 51.8]],
  // Iceland
  [[-22.5, 63.4], [-19, 63.5], [-14.5, 63.4], [-14, 64.4], [-14.5, 65.5], [-15.5, 66.4], [-19, 66.3], [-22.5, 66], [-23.8, 65.3], [-22.9, 64.9], [-22.5, 63.4]],
  // Japan (Honshu + Hokkaido, simplified)
  [[130, 31], [131.5, 32.8], [132.5, 33.4], [134, 34], [135.8, 34.6], [137, 35], [138.9, 35.5], [139.8, 36.8], [140.4, 38], [141.5, 39.5], [141.9, 41.2], [141.3, 42.6], [140.4, 42.8], [141.8, 43.3], [143, 42], [144.4, 44], [145.8, 44.1], [144.5, 43.5], [143.2, 42.9], [142, 42.4], [141, 40.9], [140.9, 39], [140, 37], [139.5, 35.5], [137.5, 34.9], [136, 34.6], [135, 34], [133.5, 33.9], [132, 33.2], [130.9, 32.5], [130, 31]],
  // Indonesia & New Guinea (main islands, simplified)
  [[95.3, 5.6], [97.5, 5.2], [99, 2.5], [100.5, 0], [102.5, -2], [104.5, -4], [105.8, -5.9], [104.5, -5.7], [102, -3.8], [99.5, -0.5], [97, 2], [95.3, 4], [95.3, 5.6]],
  [[109.6, 0.8], [110.3, 2.5], [112.5, 3.5], [114.5, 4], [116.5, 5.5], [117.8, 3.5], [118.5, 1.5], [117.5, -0.5], [116.8, -2], [114.5, -3.3], [112, -3.2], [110.3, -1.5], [109.2, -0.2], [109.6, 0.8]],
  [[105.8, -6.8], [108, -6.8], [110.5, -6.9], [112.8, -7.2], [114.4, -7.8], [114.5, -8.7], [112, -8.3], [109, -7.8], [106.5, -7], [105.8, -6.8]],
  [[119, 0.3], [120.2, 1.3], [120.6, 0.8], [120.2, -0.9], [119.8, -1.3], [120.5, -3.5], [119.6, -5.2], [119.3, -3.3], [118.9, -1.2], [119, 0.3]],
  [[131, -0.9], [134, -2.2], [136.5, -1.8], [138.5, -2], [141, -2.7], [143.5, -3.5], [146, -5.5], [147.5, -6.5], [149.5, -8], [150.5, -9.5], [149, -10.2], [147, -9.3], [145.5, -8], [143, -7.5], [140.5, -6.5], [138, -5.5], [135.5, -4.2], [133, -3.8], [131.5, -2.5], [130.8, -1.5], [131, -0.9]],
  // Philippines (Luzon + Mindanao, simplified)
  [[119.9, 18.3], [121.5, 18.2], [122.2, 17], [121.8, 15.8], [121.5, 14], [120.8, 13.6], [121.5, 13], [122.5, 13.8], [121.8, 15], [121, 16.2], [120.4, 16.5], [119.9, 17.5], [119.9, 18.3]],
  [[122, 7.8], [123.5, 9], [124.5, 8.8], [126.2, 8.5], [126.4, 7.2], [125.5, 6.8], [124, 6], [122.5, 6.8], [122, 7.8]],
  // Australia
  [[113.6, -22], [113.2, -24.5], [113.6, -26.5], [115, -31.5], [115.1, -33.6], [117.9, -35.1], [119.5, -34.4], [122, -34], [124.5, -33], [127, -32.3], [129, -31.7], [130.5, -31.9], [132.3, -32], [133.8, -32.3], [135, -34.9], [136, -35], [137.8, -35.1], [138, -35.7], [139.7, -36.8], [140.9, -38.3], [143, -38.5], [145.4, -38.3], [146.4, -39], [147.9, -37.8], [149.9, -37.2], [150.7, -35.1], [151.3, -33.6], [153, -30.9], [153.2, -27.5], [151.8, -24.5], [150.8, -23.4], [149.2, -21.1], [146.3, -19.2], [146, -18.5], [145.8, -16.3], [145.3, -14.9], [143.6, -13], [142.6, -10.7], [142.2, -11.5], [142.1, -13.5], [142.3, -15.5], [141.7, -17.3], [140.9, -17.7], [139.2, -17.6], [136.7, -15.4], [135.5, -14.9], [135.4, -12.3], [134, -11.8], [132.6, -11.3], [131, -12.3], [129.5, -13.5], [127.5, -14], [126.5, -13.9], [125.2, -16.4], [123.5, -16.8], [122.2, -17], [121, -19.9], [118.5, -20.3], [116.8, -20.6], [114.9, -21.7], [113.6, -22]],
  // New Zealand
  [[172.7, -40.6], [174.3, -41.3], [174.8, -41.3], [176.9, -37.6], [178, -37.5], [175.9, -36.5], [174.3, -36.4], [173.9, -35.2], [173, -34.5], [172.8, -35.7], [173.9, -36.8], [174.8, -39], [174.9, -40.4], [175.8, -40.6], [174.3, -41.2], [173.9, -41.6], [172.7, -40.6]],
  [[166.6, -46], [167.5, -45.9], [168.3, -46.5], [169.2, -46.2], [170.5, -45.8], [171.2, -44.9], [172.7, -43.6], [173.1, -42.9], [172.2, -42.4], [171.4, -41.8], [169.5, -43.6], [168.2, -44.5], [166.8, -45.8], [166.6, -46]],
  // Sri Lanka + Cuba (small island plates of geography)
  [[79.8, 9.8], [80.9, 9.8], [81.9, 8.6], [81.6, 7], [81.9, 6.4], [80.9, 5.9], [79.9, 6.2], [79.7, 7.5], [79.8, 9.8]],
  [[-84.9, 21.9], [-82.5, 23], [-80, 23], [-77.2, 21.2], [-75, 20.3], [-74.1, 20.2], [-75.5, 20.5], [-77.5, 21], [-80.5, 22], [-83, 22.2], [-84.8, 21.9], [-84.9, 21.9]],
];

// ------------------------------------------------------- projection -----
// Equirectangular: lon → arc angle β on the wall's cylinder, lat → y
// in the display band. The single source of truth for studs, plates
// and the journey's click-zone anchors.
export function mapSurfacePoint(lon, lat, proud = 0) {
  const f = (lon + 180) / 360;
  const beta = BETA_MAX * (1 - 2 * f);
  const r = MW.radius + proud;
  return {
    pos: new THREE.Vector3(
      MW.curveCentreX - r * Math.cos(beta),
      MW.bandY0 + ((lat - MW.latBottom) / (MW.latTop - MW.latBottom)) * (MW.bandY1 - MW.bandY0),
      -r * Math.sin(beta)),
    normal: new THREE.Vector3(-Math.cos(beta), 0, -Math.sin(beta)),
    beta,
  };
}

function curvePoint(beta, y, proud = 0) {
  const r = MW.radius + proud;
  return {
    pos: new THREE.Vector3(MW.curveCentreX - r * Math.cos(beta), y, -r * Math.sin(beta)),
    normal: new THREE.Vector3(-Math.cos(beta), 0, -Math.sin(beta)),
  };
}

const _zAxis = new THREE.Vector3(0, 0, 1);
function orientTo(mesh, normal) {
  mesh.quaternion.setFromUnitVectors(_zAxis, normal.clone().normalize());
}

// ------------------------------------------------------------ plates ----
function canvasTexture(w, h, draw) {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  draw(c.getContext('2d'), w, h);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  return tex;
}

function darkPlate(w, h, draw, px = [512, 96]) {
  const tex = canvasTexture(px[0], px[1], (g, cw, ch) => {
    g.fillStyle = '#0d1015';
    g.fillRect(0, 0, cw, ch);
    g.strokeStyle = 'rgba(160,175,195,0.35)';
    g.lineWidth = 3;
    g.strokeRect(2, 2, cw - 4, ch - 4);
    draw(g, cw, ch);
  });
  return new THREE.Mesh(
    new THREE.PlaneGeometry(w, h),
    new THREE.MeshStandardMaterial({
      map: tex, roughness: 0.5, metalness: 0.2,
      emissive: 0xffffff, emissiveMap: tex, emissiveIntensity: 0.42,
    }));
}

// --------------------------------------------------------- map face -----
function buildMapTexture() {
  const W = 4096, H = 1664;
  const cx = (lon) => (lon + 180) / 360 * W;
  const cy = (lat) => (MW.latTop - lat) / (MW.latTop - MW.latBottom) * H;
  const cityByName = new Map(CITIES.map((c) => [c[0], c]));
  return canvasTexture(W, H, (g) => {
    g.fillStyle = '#070a0f';                        // near-black ocean
    g.fillRect(0, 0, W, H);
    // graticule every 30° — a map convention, not decoration
    g.strokeStyle = 'rgba(130,150,175,0.10)';
    g.lineWidth = 2;
    for (let lon = -180; lon <= 180; lon += 30) {
      g.beginPath(); g.moveTo(cx(lon), 0); g.lineTo(cx(lon), H); g.stroke();
    }
    for (let lat = -60; lat <= 75; lat += 15) {
      g.beginPath(); g.moveTo(0, cy(lat)); g.lineTo(W, cy(lat)); g.stroke();
    }
    // landmasses in dim slate
    g.fillStyle = '#39434e';
    g.strokeStyle = 'rgba(165,185,205,0.28)';
    g.lineWidth = 1.6;
    for (const ring of LAND) {
      g.beginPath();
      ring.forEach(([lon, lat], i) => (i ? g.lineTo(cx(lon), cy(lat)) : g.moveTo(cx(lon), cy(lat))));
      g.closePath();
      g.fill();
      g.stroke();
    }
    // the busiest inter-hub routes, drawn ON the surface
    const routes = [
      ['Ashburn', 'London'], ['London', 'Frankfurt'], ['Frankfurt', 'Mumbai'],
      ['Mumbai', 'Singapore'], ['Singapore', 'Tokyo'], ['Tokyo', 'Sydney'],
      ['Ashburn', 'São Paulo'], ['Los Angeles', 'Tokyo'], ['Frankfurt', 'Singapore'],
      ['London', 'Mumbai'], ['Singapore', 'Sydney'], ['Frankfurt', 'Johannesburg'],
    ];
    g.strokeStyle = 'rgba(201,162,77,0.34)';
    g.lineWidth = 3;
    for (const [a, b] of routes) {
      const A = cityByName.get(a), B = cityByName.get(b);
      if (!A || !B) continue;
      const [x1, y1] = [cx(A[2]), cy(A[1])];
      const [x2, y2] = [cx(B[2]), cy(B[1])];
      const mx = (x1 + x2) / 2, my = Math.min(y1, y2) - Math.abs(x2 - x1) * 0.14;
      g.beginPath();
      g.moveTo(x1, y1);
      g.quadraticCurveTo(mx, my, x2, y2);
      g.stroke();
    }
  });
}

// ------------------------------------------------------------- studs ----
// One instanced mesh of small emissive discs set into the panel face,
// per-instance colour + traffic brightness, breathing on a slow
// staggered cycle in the vertex shader. The amber PoP pulses — it is
// the one piece of bad news on the wall, and it should be findable.
const studUniforms = { uTime: { value: 0 } };

function buildStuds(group) {
  const n = CITIES.length;
  const geo = new THREE.CircleGeometry(0.0125, 12);
  const aColor = new Float32Array(n * 3);
  const aData = new Float32Array(n * 3);            // phase, base intensity, amber flag
  const rnd = seeded(211);
  const c = new THREE.Color();
  const mat = new THREE.ShaderMaterial({
    uniforms: studUniforms,
    vertexShader: /* glsl */`
      attribute vec3 aColor;
      attribute vec3 aData;           // phase, base, amber
      uniform float uTime;
      varying vec3 vColor;
      varying float vI;
      void main() {
        vColor = aColor;
        float pulse;
        if (aData.z > 0.5) {
          pulse = 0.4 + 0.6 * (0.5 + 0.5 * sin(uTime * 1.5 + aData.x * 6.2831));
        } else {
          pulse = 0.72 + 0.28 * sin(uTime * 0.55 + aData.x * 6.2831);
        }
        vI = aData.y * pulse;
        vec4 mv = modelViewMatrix * instanceMatrix * vec4(position, 1.0);
        gl_Position = projectionMatrix * mv;
      }`,
    fragmentShader: /* glsl */`
      varying vec3 vColor;
      varying float vI;
      void main() {
        gl_FragColor = vec4(vColor * (0.3 + vI * 2.0), 1.0);
      }`,
  });
  const studs = new THREE.InstancedMesh(geo, mat, n);
  const sockets = new THREE.InstancedMesh(
    new THREE.CircleGeometry(0.02, 12),
    new THREE.MeshBasicMaterial({ color: 0x04060a }), n);
  const dummy = new THREE.Object3D();
  CITIES.forEach(([name, lat, lon], i) => {
    const hub = HUBS.has(name);
    const amber = name === AMBER_POP.name;
    const s = mapSurfacePoint(lon, lat, 0.045);
    dummy.position.copy(s.pos);
    orientTo(dummy, s.normal);
    dummy.scale.setScalar(hub ? 1.5 : 1.0);
    dummy.updateMatrix();
    studs.setMatrixAt(i, dummy.matrix);
    const sk = mapSurfacePoint(lon, lat, 0.04);
    dummy.position.copy(sk.pos);
    dummy.updateMatrix();
    sockets.setMatrixAt(i, dummy.matrix);
    if (amber) c.setHex(PALETTE.ledAmber);
    else if (rnd() < 0.3) c.setHex(PALETTE.ledGreen);
    else c.setHex(PALETTE.lightNeutral);
    aColor.set([c.r, c.g, c.b], i * 3);
    aData.set([rnd(), hub || amber ? 1.0 : 0.32 + rnd() * 0.55, amber ? 1 : 0], i * 3);
  });
  geo.setAttribute('aColor', new THREE.InstancedBufferAttribute(aColor, 3));
  geo.setAttribute('aData', new THREE.InstancedBufferAttribute(aData, 3));
  studs.instanceMatrix.needsUpdate = true;
  sockets.instanceMatrix.needsUpdate = true;
  group.add(sockets);
  group.add(studs);
}

// ------------------------------------------------ wall furniture -------
let _clockLocal = null;
let _clockUTC = null;
let _lastSecond = -1;

function drawClock(clock, label, utc) {
  const { tex, canvas } = clock;
  const g = canvas.getContext('2d');
  const now = new Date();
  const p2 = (v) => String(v).padStart(2, '0');
  const time = utc
    ? `${p2(now.getUTCHours())}:${p2(now.getUTCMinutes())}:${p2(now.getUTCSeconds())}`
    : `${p2(now.getHours())}:${p2(now.getMinutes())}:${p2(now.getSeconds())}`;
  g.fillStyle = '#0d1015';
  g.fillRect(0, 0, canvas.width, canvas.height);
  g.strokeStyle = 'rgba(160,175,195,0.35)';
  g.lineWidth = 3;
  g.strokeRect(2, 2, canvas.width - 4, canvas.height - 4);
  g.fillStyle = '#9aa7b5';
  g.textAlign = 'left';
  g.font = '700 34px Arial, sans-serif';
  g.fillText(label, 22, 52);
  g.fillStyle = '#e8eef4';
  g.textAlign = 'right';
  g.font = '700 62px "Courier New", monospace';
  g.fillText(time, canvas.width - 20, 66);
  tex.needsUpdate = true;
}

function makeClockPlate(label, utc) {
  const canvas = document.createElement('canvas');
  canvas.width = 512; canvas.height = 84;
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  const clock = { tex, canvas };
  drawClock(clock, label, utc);
  const mesh = new THREE.Mesh(
    new THREE.PlaneGeometry(0.56, 0.092),
    new THREE.MeshStandardMaterial({
      map: tex, roughness: 0.5, metalness: 0.2,
      emissive: 0xffffff, emissiveMap: tex, emissiveIntensity: 0.5,
    }));
  return { mesh, clock, utc, label };
}

function buildFurniture(group) {
  // title plate, top centre of the wall
  const title = darkPlate(1.35, 0.17, (g, w, h) => {
    g.fillStyle = '#39ff7a';
    g.beginPath(); g.arc(52, h / 2, 13, 0, 7); g.fill();
    g.fillStyle = '#e8eef4';
    g.textAlign = 'center';
    g.font = '700 54px Arial, sans-serif';
    g.fillText('GLOBAL EDGE · LIVE', w / 2 + 26, h / 2 + 19);
  }, [1024, 128]);
  const tp = curvePoint(0, 2.58, 0.03);
  title.position.copy(tp.pos);
  orientTo(title, tp.normal);
  group.add(title);

  // the dual clock — LOCAL / UTC, the NOC signature
  _clockLocal = makeClockPlate('LOCAL', false);
  _clockUTC = makeClockPlate('UTC', true);
  for (const [clock, z] of [[_clockLocal, -1.62], [_clockUTC, 1.62]]) {
    const beta = Math.asin(-z / MW.radius);
    const cp = curvePoint(beta, 2.58, 0.03);
    clock.mesh.position.copy(cp.pos);
    orientTo(clock.mesh, cp.normal);
    group.add(clock.mesh);
  }

  // scale plate under the map
  const scale = darkPlate(2.1, 0.13, (g, w, h) => {
    g.fillStyle = '#c8d2dc';
    g.textAlign = 'center';
    g.font = '700 40px Arial, sans-serif';
    g.fillText('330+ CITIES · 120+ COUNTRIES · ~95% OF HUMANITY WITHIN 50 MS', w / 2, h / 2 + 14);
  }, [1600, 96]);
  const sp = curvePoint(0, 0.5, 0.03);
  scale.position.copy(sp.pos);
  orientTo(scale, sp.normal);
  group.add(scale);

  // hub name plates, just below their studs
  for (const name of HUBS) {
    const city = CITIES.find((c) => c[0] === name);
    if (!city) continue;
    const plate = darkPlate(0.34, 0.07, (g, w, h) => {
      g.fillStyle = '#dfe7ee';
      g.textAlign = 'center';
      g.font = '700 44px Arial, sans-serif';
      g.fillText(name.toUpperCase(), w / 2, h / 2 + 15);
    }, [512, 96]);
    const s = mapSurfacePoint(city[2], city[1] - 5.2, 0.032);
    plate.position.copy(s.pos);
    orientTo(plate, s.normal);
    group.add(plate);
  }

  // the degraded PoP's plate — anycast absorbing a failure, in writing
  const deg = darkPlate(0.40, 0.10, (g, w, h) => {
    g.fillStyle = '#ffb02e';
    g.textAlign = 'center';
    g.font = '700 88px Arial, sans-serif';
    g.fillText('RECIFE · DEGRADED', w / 2, 108);
    g.font = '700 62px Arial, sans-serif';
    g.fillText('TRAFFIC SHIFTED TO NEIGHBOURS', w / 2, 200);
  }, [1024, 256]);
  // Placement (fix loop 2): the wall's panels are ~0.44 m of arc
  // each, so the plate is 0.40 m wide and centred on ONE panel bay —
  // the previous 0.68 m plate straddled a mullion, which cut its
  // right-hand text. The stud's own bay is occupied dead-centre by
  // Fortaleza's stud, so the plate takes the bay to the east
  // (centre β ≈ 0.028 → lon ≈ −12.9), standing in the empty
  // mid-Atlantic north-east of its stud at the same height as fix
  // loop 1 put it: ~2 cm clear of both mullions, clear of every
  // stud, and far from São Paulo's name plate below the stud.
  const ds = mapSurfacePoint(AMBER_POP.lon + 22.04, AMBER_POP.lat + 5.2, 0.032);
  deg.position.copy(ds.pos);
  orientTo(deg, ds.normal);
  group.add(deg);
}

// -------------------------------------------------------------- wall ----
export function createEdgeMapWall() {
  const group = new THREE.Group();
  group.name = 's06-map-wall';
  const mapTex = buildMapTexture();
  const frameMat = new THREE.MeshStandardMaterial({ color: 0x0b0d10, roughness: 0.55, metalness: 0.4 });
  const segCount = MW.panels;
  const segArc = (2 * MW.radius * BETA_MAX) / segCount;
  const panelH = 1.76, panelMidY = (MW.bandY0 + MW.bandY1) / 2;

  for (let i = 0; i < segCount; i++) {
    const beta = -BETA_MAX + (i + 0.5) * (2 * BETA_MAX / segCount);
    const panel = new THREE.Group();
    const cp = curvePoint(beta, panelMidY, 0.004);
    panel.position.copy(cp.pos);
    orientTo(panel, cp.normal);
    const frame = new THREE.Mesh(new THREE.BoxGeometry(segArc + 0.012, panelH, 0.05), frameMat);
    panel.add(frame);
    // this panel's slice of the one map texture. Panel i sits at
    // β = −BETA_MAX + (i+½)Δ (the z +3 end), where f = (βmax−β)/2βmax
    // is near 1 — so panel i shows slice (segCount−1−i), and u rises
    // with f along the panel's local +X: the map reads unmirrored.
    const slice = mapTex.clone();
    slice.needsUpdate = true;
    slice.wrapS = THREE.ClampToEdgeWrapping;
    slice.repeat.set(1 / segCount, 1);
    slice.offset.set((segCount - 1 - i) / segCount, 0);
    const screen = new THREE.Mesh(
      new THREE.PlaneGeometry(segArc - 0.028, MW.bandY1 - MW.bandY0),
      new THREE.MeshStandardMaterial({
        color: 0x000000, emissive: 0xffffff, emissiveMap: slice, emissiveIntensity: 0.88,
        roughness: 0.35, metalness: 0.1,
      }));
    screen.position.z = 0.028;
    panel.add(screen);
    group.add(panel);
  }

  // header + sill rails following the curve
  const railMat = new THREE.MeshStandardMaterial({ color: 0x14181e, roughness: 0.5, metalness: 0.5 });
  for (const y of [2.44, 0.56]) {
    for (let i = 0; i < segCount; i++) {
      const beta = -BETA_MAX + (i + 0.5) * (2 * BETA_MAX / segCount);
      const rail = new THREE.Mesh(new THREE.BoxGeometry(segArc + 0.012, 0.07, 0.09), railMat);
      const cp = curvePoint(beta, y, 0.01);
      rail.position.copy(cp.pos);
      orientTo(rail, cp.normal);
      group.add(rail);
    }
  }

  buildStuds(group);
  buildFurniture(group);

  return {
    group,
    tick(t) {
      studUniforms.uTime.value = t;
      const sec = Math.floor(t);
      if (sec !== _lastSecond && _clockLocal && _clockUTC) {
        _lastSecond = sec;
        drawClock(_clockLocal.clock, 'LOCAL', false);
        drawClock(_clockUTC.clock, 'UTC', true);
      }
    },
  };
}

// World position of the amber (degraded) PoP stud — the journey's
// click-zone anchor for the map wall.
export function amberPopAnchor() {
  const s = mapSurfacePoint(AMBER_POP.lon, AMBER_POP.lat, 0.05);
  return { centre: [s.pos.x, s.pos.y, s.pos.z], size: [0.34, 0.34, 0.3] };
}
