/**
 * Definitive VIBEATHON 2026 competitor roster supplied by the organising team.
 *
 * This is operational data, not public-site content: it is used exclusively by
 * the protected importer and is exposed only through jury-authorised endpoints.
 */
export type DefinitiveTeamMember = {
  fullName: string;
  gender: "Femme" | "Homme";
  email: string;
  phone: string;
};

export type DefinitiveTeam = {
  name: string;
  domain: "Agriculture" | "Énergie" | "Ressources" | "Transport";
  members: readonly DefinitiveTeamMember[];
};

export const definitiveTeamRoster2026: readonly DefinitiveTeam[] = [
  { name: "Code Hunters", domain: "Transport", members: [
    { fullName: "Diomande Hamed Meloua", gender: "Homme", email: "hdiomande924@gmail.com", phone: "0707779756" },
    { fullName: "DOFFOU Eddy Yann Chris Kelly", gender: "Homme", email: "chriskellydoffou@gmail.com", phone: "0702150687" },
    { fullName: "KASSOGUE ARDJOUMA", gender: "Homme", email: "ardjoumakassogue85@gmail.com", phone: "0586659138" },
    { fullName: "Kone Tenemakan", gender: "Homme", email: "tenemakankone2004@gmail.com", phone: "0102488757" },
    { fullName: "OUATTARA Nadin Daniel Yann-Axel", gender: "Homme", email: "daniouattara777@gmail.com", phone: "0544151258" },
  ] },
  { name: "Coding Team", domain: "Énergie", members: [
    { fullName: "Atto Mienman Anne Bérénice", gender: "Femme", email: "annebereniceatto@gmail.com", phone: "0555771278" },
    { fullName: "Djoman Ange", gender: "Homme", email: "djomanange7@gmail.com", phone: "0595769907" },
    { fullName: "GNANZOU Messouma Auriane", gender: "Femme", email: "aurianegnanzou8@gmail.com", phone: "0544780053" },
    { fullName: "INEKA Junior", gender: "Homme", email: "juniinekajunior@gmail.com", phone: "0170327949" },
    { fullName: "KEBE ABDOUL KADER", gender: "Homme", email: "abdoulkaderkebe3@gmail.com", phone: "0575023392" },
  ] },
  { name: "Devsione", domain: "Agriculture", members: [
    { fullName: "Agbenonzan Kossivi Jacques Junior", gender: "Homme", email: "junioragbenonzan31@gmail.com", phone: "0575889826" },
    { fullName: "Haidara inza", gender: "Homme", email: "haidoucherif04@gmail.com", phone: "0713427656" },
    { fullName: "Sanogo Souleymane", gender: "Homme", email: "sanogosouley149@gmail.com", phone: "0504036004" },
    { fullName: "Toure Erica Kinonton Marie-Victoire", gender: "Femme", email: "toureerica43@gmail.com", phone: "0788082245" },
    { fullName: "YOUL SANSAN FULGENCE", gender: "Homme", email: "youlsansan123@gmail.com", phone: "0778114938" },
  ] },
  { name: "FOR MIND", domain: "Transport", members: [
    { fullName: "Aman Nanou Fidèle Elisée", gender: "Homme", email: "eliseeaman2@gmail.com", phone: "0586971163" },
    { fullName: "DADIÉ KOUTOUA JEAN MARIE ELIEL", gender: "Homme", email: "koutouadadie17@gmail.com", phone: "0713751588" },
    { fullName: "IRIE BI FEH JOEL", gender: "Homme", email: "fehirie029@gmail.com", phone: "0566468646" },
    { fullName: "N'zue Kouakou Michel-Alberich", gender: "Homme", email: "nzuemichel01@gmail.com", phone: "0143561036" },
    { fullName: "Yapo Marie Grâce Carmen", gender: "Femme", email: "cxrmxn1906@gmail.com", phone: "0777846713" },
  ] },
  { name: "KodoCode", domain: "Ressources", members: [
    { fullName: "Toueu Nunkahon Guy-Brice", gender: "Homme", email: "brice.toueu@gmail.com", phone: "0759321235" },
    { fullName: "ZRANGO SOSTHÈNE ODILON", gender: "Homme", email: "sosthene57odilon@gmail.com", phone: "0757457165" },
    { fullName: "Gnidé jean Jacques Wilfried", gender: "Homme", email: "wgnide@gmail.com", phone: "0758746788" },
    { fullName: "Yeo Nidjo Kalifa", gender: "Homme", email: "kalifayeo11@gmail.com", phone: "0797676545" },
    { fullName: "Zakeï marie prunelle", gender: "Femme", email: "prunellework@gmail.com", phone: "0715195280" },
  ] },
  { name: "KOFF FAMILY", domain: "Agriculture", members: [
    { fullName: "Edja N’dri Mira", gender: "Femme", email: "medja314@gmail.com", phone: "0545551405" },
    { fullName: "Koffi yao Mondesir", gender: "Homme", email: "koffiyaomondesir324@gmail.com", phone: "0564990104" },
    { fullName: "Kouadio Kouadio Hermann", gender: "Homme", email: "kouadiosherman@gmail.com", phone: "0575590881" },
    { fullName: "OLADOKOU EMMANUEL JOSEPH", gender: "Homme", email: "emmanueljosepholadokou@gmail.com", phone: "0505307581" },
    { fullName: "Coulibaly Fangapele", gender: "Homme", email: "coulfang@gmail.com", phone: "707480809" },
  ] },
  { name: "La triade", domain: "Agriculture", members: [
    { fullName: "Adou Marie Nauselle", gender: "Femme", email: "nauselleadou@gmail.com", phone: "0585750449" },
    { fullName: "Compaoré Abdoul Aziz", gender: "Homme", email: "azizcompaore252@gmail.com", phone: "0789186558" },
    { fullName: "Latte Essoh jean Benoit", gender: "Homme", email: "jeanbenoitlatte125@gmail.com", phone: "0779995890" },
    { fullName: "OUATTARA SALIF MOHAMED", gender: "Homme", email: "ouattarasalif2005@gmail.com", phone: "0102834123" },
    { fullName: "COULIBALY Siélé Dabila", gender: "Homme", email: "coulibalysieledabila@gmail.com", phone: "0501210840" },
  ] },
  { name: "Néon Code", domain: "Agriculture", members: [
    { fullName: "BOLI ANGE", gender: "Homme", email: "angeemmanuel843@gmail.com", phone: "05 44 74 26 18" },
    { fullName: "Dosso Safiatou Mariame", gender: "Femme", email: "dossomariame04@gmail.com", phone: "0703828419" },
    { fullName: "KOFFI SOURALEY DAH AXEL EVAN", gender: "Homme", email: "koffiaxelevan@gmail.com", phone: "0777000131" },
    { fullName: "KOUADIO ANGE ARMEL", gender: "Homme", email: "kouadioarmel055@gmail.com", phone: "0779220546" },
    { fullName: "N'ZORE ASSEMIEN AYMERIC CHRIST JUNIOR", gender: "Homme", email: "aymeric.nzore@gmail.com", phone: "0566607775" },
  ] },
  { name: "NeuroGhost", domain: "Ressources", members: [
    { fullName: "ANOH AMIEN CHRIST FABIEN", gender: "Homme", email: "amienfabien@gmail.com", phone: "0706528067" },
    { fullName: "KOUANDE Noura Samira Marie-Priscille", gender: "Femme", email: "kouandenoura123@gmail.com", phone: "0707056566" },
    { fullName: "Ossey Yvan Jean De Kenty", gender: "Homme", email: "yvanossey6@gmail.com", phone: "0767214818" },
    { fullName: "Tanoh Khalil", gender: "Homme", email: "tanohkhalil@gmail.com", phone: "0767892177" },
    { fullName: "Yao M. Ariel Cherubin", gender: "Homme", email: "cherubinyao00@gmail.com", phone: "0779895471" },
  ] },
  { name: "Nexus", domain: "Transport", members: [
    { fullName: "Brou Essoua Jean Louis Georges Hervé", gender: "Homme", email: "hervegeorges002@gmail.com", phone: "0576522712" },
    { fullName: "Kobenan Adingra Jean Israël", gender: "Homme", email: "kobenanadingraj@gmail.com", phone: "0585253972" },
    { fullName: "Kouamé Charles Marie-Eunice", gender: "Femme", email: "marieeunice36@gmail.com", phone: "0708519288" },
    { fullName: "KOUASSI NELLY ANNE RITA", gender: "Femme", email: "kouassirita0@gmail.com", phone: "0787038676" },
    { fullName: "Kra akoua djinaa marie odile", gender: "Femme", email: "kramarieodile@gmail.com", phone: "0508222810" },
  ] },
  { name: "P-6", domain: "Ressources", members: [
    { fullName: "Keke Axelle Rameaux", gender: "Femme", email: "ramoskeke16@gmail.com", phone: "0700133695" },
    { fullName: "Kouadio Guy-Mosley", gender: "Homme", email: "kouadioguymosley@gmail.com", phone: "0152207912" },
    { fullName: "Kouakou Yao Cedric Roland", gender: "Homme", email: "kouakoucedric420@gmail.com", phone: "0715977164" },
    { fullName: "KOUAKOU YAO DONALD WILFRIED", gender: "Homme", email: "wilfriedkouakou52@gmail.com", phone: "0778583700" },
    { fullName: "Maïva Jasmine Eletra MOTOMBI ASSOGHO", gender: "Femme", email: "elektramaiva@gmail.com", phone: "0768752959" },
  ] },
  { name: "Team Innovation", domain: "Transport", members: [
    { fullName: "DIOMANDE KEUWE MICKAEL", gender: "Homme", email: "keuwemichael@gmail.com", phone: "0546089911" },
    { fullName: "DJEKE Koffi kan christ David", gender: "Homme", email: "daviddjek4@gmail.com", phone: "0575161664" },
    { fullName: "Kouadio Fréjus Yao Elie", gender: "Homme", email: "frejusdev@gmail.com", phone: "0767998373" },
    { fullName: "Lasme Yeble Samuela", gender: "Femme", email: "lasmesamuela09@gmail.com", phone: "0153430814" },
    { fullName: "N’GUESSAN MOAYÉ JEMIMA OCÉANE", gender: "Femme", email: "jemimaoceanenguessan@gmail.com", phone: "0142580579" },
  ] },
  { name: "Vortex", domain: "Transport", members: [
    { fullName: "ABDOU SALIFOU MAHAMADOU BACHIR", gender: "Homme", email: "bachirabdou2468@gmail.com", phone: "+227 88 16 99 15" },
    { fullName: "Ivo Abdoulrhamane Nestor", gender: "Homme", email: "abdoulrhamane.ivo@gmail.com", phone: "0161559035" },
    { fullName: "NASSIROU SALEY Hamida", gender: "Femme", email: "hamidanassir008@gmail.com", phone: "0797623761" },
    { fullName: "SAÏDOU SAMBA Fatouma Zahra", gender: "Femme", email: "sambafatoumazahra@gmail.com", phone: "0702649506" },
    { fullName: "Savadogo RAZAKIM", gender: "Homme", email: "srazakim@gmail.com", phone: "0544990309" },
  ] },
  { name: "VORTEXON", domain: "Ressources", members: [
    { fullName: "AGUIA PAUL ELIEL", gender: "Homme", email: "elielpaul3@gmail.com", phone: "0715322550" },
    { fullName: "Amani ketsia GNAMIENMOH", gender: "Femme", email: "amaniketsiag@gmail.com", phone: "0767791026" },
    { fullName: "DJEGBA DJOUPODE ESMEL", gender: "Homme", email: "esmeldjegba@gmail.com", phone: "0594535086" },
    { fullName: "Niangadou Malick Souleymane Ange Junior", gender: "Homme", email: "themalickdsg@gmail.com", phone: "0719753077 / 0714648212" },
    { fullName: "YAO CHRIST YVAN", gender: "Homme", email: "yaochristyvan8@gmail.com", phone: "0508748810" },
  ] },
  { name: "AGRI-FEDAG", domain: "Agriculture", members: [
    { fullName: "DJELE BI VAMI", gender: "Homme", email: "gaddieldjele@gmail.com", phone: "0778661643" },
    { fullName: "EZOUA EMIAN CHRIST ESLI", gender: "Homme", email: "ez.emian77@gmail.com", phone: "0161407064" },
    { fullName: "Fameni Anael", gender: "Homme", email: "anaelfameni@gmail.com", phone: "0595335662" },
    { fullName: "GODI WOGO FRANCK DOMINIQUE", gender: "Femme", email: "godmik179@gmail.com", phone: "0702118597" },
    { fullName: "Ouattara Kandienguê Fatim Alexandra", gender: "Femme", email: "fatimouat239@gmail.com", phone: "0712187946" },
  ] },
  { name: "Asilis-Tech", domain: "Agriculture", members: [
    { fullName: "Groga Nelly", gender: "Femme", email: "nellyjimna@gmail.com", phone: "0767074397" },
    { fullName: "KOFFI Chris-Yvann Yédidia", gender: "Homme", email: "prokoffichris23@gmail.com", phone: "0789445006" },
    { fullName: "KOUAKOU BA BENIAN FRANCKLIN", gender: "Homme", email: "benianfrancklin@gmail.com", phone: "0767512449" },
    { fullName: "KOUTON Vignon Esmel", gender: "Homme", email: "esmelyann@gmail.com", phone: "0505411990" },
    { fullName: "KOUYATE LAMINE", gender: "Homme", email: "lk6127017@gmail.com", phone: "0554659089" },
  ] },
  { name: "INNOVASTABLE", domain: "Transport", members: [
    { fullName: "Amadou Coulibaly", gender: "Homme", email: "amadoucodeur@gmail.com", phone: "0705023269" },
    { fullName: "BROU JEAN MARIE EPHREM GHISLAIN", gender: "Homme", email: "broujeanmarie697@gmail.com", phone: "0151197476" },
    { fullName: "DILAN CYRIL AHIWA", gender: "Homme", email: "cyrilleahiwa@gmail.com", phone: "0768953348" },
    { fullName: "KONE KIGNELMAN GRÂCE EMMANUELLA", gender: "Femme", email: "kignelemma@gmail.com", phone: "0713777318" },
    { fullName: "Tanoh Marie Ange Huguette Badjo", gender: "Femme", email: "tanohmarieange9@gmail.com", phone: "07 08 73 43 86" },
  ] },
  { name: "TerraFlow Africa", domain: "Transport", members: [
    { fullName: "GNAHOUA", gender: "Homme", email: "akenoostudio@gmail.com", phone: "0749931142" },
    { fullName: "GOH TANGUY BRUNO", gender: "Homme", email: "gohtanguybruno@gmail.com", phone: "0171042260" },
    { fullName: "Komoe edgar junior", gender: "Homme", email: "junioredgarkomoe@gmail.com", phone: "0758944501" },
    { fullName: "Kouadio Ange Didier Junior", gender: "Homme", email: "ange3.kouadio@uvci.edu.ci", phone: "0779199240" },
    { fullName: "Kragba deuh henriette dadi", gender: "Femme", email: "deuhhenriettedadikragba@gmail.com", phone: "07780190111" },
  ] },
  { name: "Innov-Tech", domain: "Transport", members: [
    { fullName: "KOUAKOU Affoue Esther Dorcas", gender: "Femme", email: "kouakoudorcas21@gmail.com", phone: "0575653456" },
    { fullName: "Kouassi Comoe Marc", gender: "Homme", email: "kouassicomoemarc25@gmail.com", phone: "0500417171" },
    { fullName: "Ouattara Rachidatou", gender: "Femme", email: "rachidatou675@gmail.com", phone: "0585893788" },
    { fullName: "Yeboue Emmanuel Levi", gender: "Homme", email: "yelevy02@gmail.com", phone: "704539581" },
    { fullName: "Konaté kiman", gender: "Homme", email: "konatekiman@gmail.com", phone: "0544114124" },
  ] },
  { name: "Wattchers", domain: "Énergie", members: [
    { fullName: "KAMBOU NAFISSATOU", gender: "Femme", email: "kambounafissatou183@gmail.com", phone: "0713956019" },
    { fullName: "OUSSOU Adjoua-Marie Berrah", gender: "Femme", email: "berrah.oussou@gmail.com", phone: "0715082599" },
    { fullName: "SEKONGO Yéwonyéta", gender: "Femme", email: "sekongoyewonyeta090@gmail.com", phone: "0170267098" },
    { fullName: "YAPO Odjé Soby Arielle Marie-Ester", gender: "Femme", email: "ayapo4092@gmail.com", phone: "0102151075" },
    { fullName: "ALAO Ibrahim Daniel", gender: "Homme", email: "danielalao1914@gmail.com", phone: "0544183205" },
  ] },
];
