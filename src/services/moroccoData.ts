export interface MoroccanCity {
  name: string;
  arabicName: string;
  region: string;
  deliveryTimeHours: number; // e.g., 24h or 48h
  deliveryNote: string;
}

export const MOROCCAN_CITIES: MoroccanCity[] = [
  { name: 'Casablanca', arabicName: 'الدار البيضاء', region: 'Casablanca-Settat', deliveryTimeHours: 24, deliveryNote: 'Livraison express à domicile sous 24h' },
  { name: 'Rabat', arabicName: 'الرباط', region: 'Rabat-Salé-Kénitra', deliveryTimeHours: 24, deliveryNote: 'Livraison express à domicile sous 24h' },
  { name: 'Marrakech', arabicName: 'مراكش', region: 'Marrakech-Safi', deliveryTimeHours: 24, deliveryNote: 'Livraison à domicile 24h-48h' },
  { name: 'Tanger', arabicName: 'طنجة', region: 'Tanger-Tétouan-Al Hoceïma', deliveryTimeHours: 24, deliveryNote: 'Livraison à domicile 24h' },
  { name: 'Fès', arabicName: 'فاس', region: 'Fès-Meknès', deliveryTimeHours: 24, deliveryNote: 'Livraison à domicile 24h-48h' },
  { name: 'Agadir', arabicName: 'أكادير', region: 'Souss-Massa', deliveryTimeHours: 48, deliveryNote: 'Livraison à domicile 24h-48h' },
  { name: 'Meknès', arabicName: 'مكناس', region: 'Fès-Meknès', deliveryTimeHours: 24, deliveryNote: 'Livraison à domicile 24h-48h' },
  { name: 'Oujda', arabicName: 'وجدة', region: 'Oriental', deliveryTimeHours: 48, deliveryNote: 'Livraison à domicile 48h' },
  { name: 'Kénitra', arabicName: 'القنيطرة', region: 'Rabat-Salé-Kénitra', deliveryTimeHours: 24, deliveryNote: 'Livraison à domicile 24h' },
  { name: 'Tétouan', arabicName: 'تطوان', region: 'Tanger-Tétouan-Al Hoceïma', deliveryTimeHours: 24, deliveryNote: 'Livraison à domicile 24h-48h' },
  { name: 'Salé', arabicName: 'سلا', region: 'Rabat-Salé-Kénitra', deliveryTimeHours: 24, deliveryNote: 'Livraison à domicile 24h' },
  { name: 'Mohammedia', arabicName: 'المحمدية', region: 'Casablanca-Settat', deliveryTimeHours: 24, deliveryNote: 'Livraison le jour même ou 24h' },
  { name: 'El Jadida', arabicName: 'الجديدة', region: 'Casablanca-Settat', deliveryTimeHours: 24, deliveryNote: 'Livraison à domicile 24h-48h' },
  { name: 'Nador', arabicName: 'الناظور', region: 'Oriental', deliveryTimeHours: 48, deliveryNote: 'Livraison à domicile 48h' },
  { name: 'Safi', arabicName: 'آسفي', region: 'Marrakech-Safi', deliveryTimeHours: 48, deliveryNote: 'Livraison à domicile 48h' },
  { name: 'Beni Mellal', arabicName: 'بني ملال', region: 'Béni Mellal-Khénifra', deliveryTimeHours: 48, deliveryNote: 'Livraison à domicile 48h' },
  { name: 'Khouribga', arabicName: 'خريبكة', region: 'Béni Mellal-Khénifra', deliveryTimeHours: 48, deliveryNote: 'Livraison à domicile 48h' },
  { name: 'Taza', arabicName: 'تازة', region: 'Fès-Meknès', deliveryTimeHours: 48, deliveryNote: 'Livraison à domicile 48h' },
  { name: 'Errachidia', arabicName: 'الرشيدية', region: 'Drâa-Tafilalet', deliveryTimeHours: 72, deliveryNote: 'Livraison à domicile 48h-72h' },
  { name: 'Laâyoune', arabicName: 'العيون', region: 'Laâyoune-Sakia El Hamra', deliveryTimeHours: 72, deliveryNote: 'Livraison express provinces du sud 48h-72h' },
  { name: 'Dakhla', arabicName: 'الداخلة', region: 'Dakhla-Oued Ed-Dahab', deliveryTimeHours: 72, deliveryNote: 'Livraison express provinces du sud' }
];

export const RECENT_MOROCCAN_BUYERS = [
  { name: 'Youssef B.', city: 'Casablanca', timeAgo: 'il y a 3 min', item: 'Parfum Oud Royal Noir 100ml' },
  { name: 'Fatima-Zahra M.', city: 'Rabat', timeAgo: 'il y a 5 min', item: 'Brosse Coiffante Ionique 5-en-1' },
  { name: 'Mehdi A.', city: 'Marrakech', timeAgo: 'il y a 7 min', item: 'Montre Chronographe Automatique Apex' },
  { name: 'Khadija E.', city: 'Tanger', timeAgo: 'il y a 11 min', item: 'Coffret Royal Musc Blanc & Rose' },
  { name: 'Amine K.', city: 'Fès', timeAgo: 'il y a 14 min', item: 'Tondeuse Sans Fil Pro Gold' },
  { name: 'Soukaina T.', city: 'Agadir', timeAgo: 'il y a 18 min', item: 'Sac Cabas Cuir Italien Doré' },
  { name: 'Hicham S.', city: 'Kénitra', timeAgo: 'il y a 22 min', item: 'T-Shirt Coton Bio Coupe Boxy' }
];
