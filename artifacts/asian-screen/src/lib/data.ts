export type TitleType = 'movie' | 'series';
export type Country = 'Korea' | 'China' | 'Japan' | 'Thailand' | 'Taiwan';
export type Title = {
  id: string; title: string; originalTitle: string; type: TitleType; country: Country;
  year: number; rating: number; genres: string[]; description: string; poster: string;
  backdrop: string; trailer: string; language: string; status: 'Ongoing' | 'Completed';
  seasons: number; episodes: number; cast: string[]; director: string; popularity: number;
  hd?: string;
};

const palettes = [
  ['#26151b','#b63836'], ['#121f2a','#3b7895'], ['#202015','#9d7d38'],
  ['#1c1627','#765389'], ['#231617','#8c4d3c'], ['#162522','#327d70'],
];
const poster = (name: string, index: number, wide = false) => {
  const [a,b] = palettes[index % palettes.length];
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${wide ? 1600 : 700}" height="${wide ? 900 : 1000}" viewBox="0 0 ${wide ? 1600 : 700} ${wide ? 900 : 1000}"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop stop-color="${a}"/><stop offset="1" stop-color="${b}"/></linearGradient><filter id="n"><feTurbulence type="fractalNoise" baseFrequency=".55" numOctaves="3" stitchTiles="stitch"/></filter></defs><rect width="100%" height="100%" fill="url(#g)"/><circle cx="${wide ? 1180 : 510}" cy="190" r="${wide ? 210 : 150}" fill="#f3d9b2" opacity=".14"/><path d="M0 ${wide ? 690 : 770} Q${wide ? 500 : 230} ${wide ? 440 : 570} ${wide ? 1030 : 420} ${wide ? 720 : 760} T${wide ? 1700 : 720} ${wide ? 680 : 850} V${wide ? 1000 : 1100} H0Z" fill="#091018" opacity=".58"/><rect width="100%" height="100%" filter="url(#n)" opacity=".07"/><text x="8%" y="${wide ? 81 : 79}%" fill="#f5e8d0" font-family="Georgia" font-size="${wide ? 64 : 42}" font-weight="bold">${name.replace(/&/g,'&amp;')}</text><text x="8%" y="${wide ? 89 : 87}%" fill="#f5e8d0" opacity=".65" font-family="sans-serif" font-size="${wide ? 18 : 14}" letter-spacing="5">ASIAN SCREEN / ${String(index + 1).padStart(2,'0')}</text></svg>`;
  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
};

const records: Array<[string,string,TitleType,Country,number,number,string[],string,string,string,string]> = [
  ['Night Letters','밤의 편지','series','Korea',2024,9.1,['Romance','Melodrama'],'A quiet translator discovers a stack of letters that rewrite the story of a vanished love.','Korean','Han Seo-jin','Kim Ji-won|Park Do-yun'],
  ['The Eighth Room','第八间房','series','China',2024,8.8,['Mystery','Period'],'In a rain-soaked city, a restoration architect finds a room that remembers every visitor.','Mandarin','Lu Wei','Zhang Ziyi|Chen Xing'],
  ['Paper Lanterns','紙灯り','series','Japan',2023,8.7,['Drama','Family'],'Three sisters return to their coastal home to settle a debt their mother left behind.','Japanese','Mika Sato','Aoi Tanaka|Ren Mori'],
  ['After the Monsoon','หลังฝน','series','Thailand',2024,8.9,['Romance','Drama'],'A radio host and a night-shift baker meet only when the city floods.','Thai','Niran Chai','Pimchanok Luevisadpaibul|Kawin Wattanakul'],
  ['Blue Hour Taipei','藍色時刻','series','Taiwan',2023,8.6,['Romance','Slice of Life'],'Two strangers trade apartments and slowly inherit each other’s routines.','Mandarin','Hsu Wei-ting','Lin Po-hung|Kao Yu-ting'],
  ['Velvet Season','유리 계절','series','Korea',2022,8.5,['Thriller','Drama'],'A costume designer enters the orbit of a disgraced stage director.','Korean','Yoon Mirae','Lee Joon-ho|Seo Eun-chae'],
  ['Emperor of Rain','雨中帝','series','China',2022,8.4,['Period','Political'],'An exiled prince returns home disguised as the keeper of palace gardens.','Mandarin','Wang Jian','Liu Yifei|Hu Ge'],
  ['The Last Train Home','終電のあと','series','Japan',2024,8.3,['Mystery','Drama'],'Passengers on the last train discover they all remember the same missing stop.','Japanese','Kenta Mori','Suzu Hirose|Masaki Suda'],
  ['Small Hours','ตีสอง','series','Thailand',2022,8.2,['Comedy','Romance'],'A stubborn wedding planner finds the best advice arrives after midnight.','Thai','Nok Piyaporn','Baifern Pimchanok|Tor Thanapob'],
  ['The Sound of Rain','雨聲','series','Taiwan',2021,8.5,['Music','Drama'],'A retired pianist records the sounds of an old neighborhood before it disappears.','Mandarin','Yao Chen','Greg Hsu|Vivian Sung'],
  ['Crimson Tide','붉은 파도','series','Korea',2023,8.4,['Crime','Thriller'],'A prosecutor follows a red ribbon through the city’s forgotten archives.','Korean','Jang Tae-sik','Bae Doona|Wi Ha-jun'],
  ['Jade Orchard','玉园','series','China',2021,8.1,['Romance','Family'],'A family orchard becomes a battleground for three generations of women.','Mandarin','Qiao Lin','Zhou Xun|Wang Kai'],
  ['Under the Eaves','軒下','series','Japan',2020,8.0,['Family','Drama'],'A carpenter quietly repairs the house where he grew up and everyone inside it.','Japanese','Riku Arai','Hikari Mitsushima|Ryohei Suzuki'],
  ['Saffron Sky','ฟ้าหญ้าฝรั่น','series','Thailand',2021,7.9,['Drama','Romance'],'A botanist and a street photographer map the rare flowers of the north.','Thai','Anong Srisuk','Nadech Kugimiya|Yaya Urassaya'],
  ['Sea Glass','海玻璃','series','Taiwan',2020,8.2,['Drama','Mystery'],'A forensic illustrator sees a different ending in every shard of sea glass.','Mandarin','Chen Yu','Ruby Lin|Joseph Chang'],
  ['Borrowed Light','빌린 빛','series','Korea',2020,8.0,['Romance','Drama'],'A projectionist and a film archivist save a cinema one reel at a time.','Korean','Oh Min-soo','Kim Tae-ri|Yoo Yeon-seok'],
  ['The Silk Map','丝路图','series','China',2020,7.8,['Adventure','Period'],'A cartographer follows a hand-drawn map into a border town with no name.','Mandarin','He Qiao','Yang Mi|Zhang Ruoyun'],
  ['Low Tide Tokyo','干潮','series','Japan',2019,7.9,['Romance','Urban'],'A sound engineer records an empty city while deciding whether to leave it.','Japanese','Nao Kobayashi','Haruka Ayase|Takeru Satoh'],
  ['Bangkok After Dark','กรุงเทพหลังเที่ยงคืน','series','Thailand',2019,7.7,['Crime','Drama'],'A cab driver becomes the reluctant witness to a city’s secret midnight economy.','Thai','Preecha Kittisak','Mario Maurer|Davika Hoorne'],
  ['The Archive of Us','我們的檔案','series','Taiwan',2019,7.8,['Romance','Drama'],'An archivist uncovers a lost love story hidden in public records.','Mandarin','Lin Cheng','Alice Ko|Derek Chang'],
  ['A Season in Dust','먼지의 계절','series','Korea',2024,8.2,['Drama','Slice of Life'],'A ceramicist moves into an old motel and finds community among its night guests.','Korean','Lee Na-ri','Jeon Yeo-been|Choi Woo-shik'],
  ['The Red Pavilion','红亭','series','China',2024,8.0,['Mystery','Period'],'A tea house owner solves small crimes while waiting for a larger betrayal.','Mandarin','Su Mei','Bai Lu|Luo Yunxi'],
  ['Kintsugi Summer','金継ぎの夏','series','Japan',2023,8.1,['Romance','Family'],'A restorer returns to repair one bowl and the family around it.','Japanese','Yui Shibata','Mitsuki Takahata|Kentaro Sakaguchi'],
  ['Lantern District','ย่านโคม','series','Thailand',2023,7.8,['Crime','Mystery'],'A young journalist walks a lantern district where every shop has a second door.','Thai','Suda Rattanakosin','Apo Nattawin|Mile Phakphum'],
  ['Tidal Names','潮名','series','Taiwan',2024,8.1,['Romance','Drama'],'A marine biologist comes home to identify a whale and meets an old friend.','Mandarin','Wen Yi','Tseng Jing-hua|Gingle Wang'],
  ['The Long Goodbye','긴 작별','series','Korea',2018,8.4,['Melodrama','Romance'],'A celebrated actress writes one letter for every city she leaves behind.','Korean','Park Chan-wook','Son Ye-jin|Gong Yoo'],
  ['House of Ink','墨家','series','China',2018,8.3,['Period','Drama'],'A calligrapher’s daughter takes over a school built on a family secret.','Mandarin','Li Fang','Tang Wei|Eddie Peng'],
  ['Orchard Moon','果樹園の月','series','Japan',2018,8.0,['Family','Romance'],'A moonlit harvest brings an estranged father and daughter back to one table.','Japanese','Miyu Tanaka','Sakura Ando|Sosuke Ikematsu'],
  ['White Noise','เสียงสีขาว','series','Thailand',2018,7.9,['Thriller','Drama'],'A sound therapist hears a confession beneath the static of every recording.','Thai','Kiet Ananda','Chanon Santinatornkul|Aokbab Chutimon'],
  ['The Blue House','藍屋','series','Taiwan',2018,7.7,['Family','Drama'],'A family motel becomes a refuge for people with nowhere else to go.','Mandarin','Lin Hsin','Sylvia Chang|Mark Chao'],
  ['Midnight Cinema','자정 극장','movie','Korea',2024,8.9,['Drama','Romance'],'Two strangers share a private screening and a night that changes their route home.','Korean','Cho Eun-ha','Bae Suzy|Jung Hae-in'],
  ['A Road Through Snow','雪路','movie','China',2023,8.5,['Adventure','Drama'],'A courier crosses the mountains with a parcel addressed to someone who died.','Mandarin','Yuan Song','Zhou Dongyu|Jackson Yee'],
  ['Before the Tea Cools','茶が冷める前に','movie','Japan',2022,8.4,['Drama','Family'],'A tea master gives four visitors one impossible hour to say goodbye.','Japanese','Yuki Kazama','Satomi Ishihara|Hidetoshi Nishijima'],
  ['The Mango Season','ฤดูมะม่วง','movie','Thailand',2023,8.0,['Romance','Comedy'],'A chef returns to her grandmother’s orchard to cook one final feast.','Thai','Ploy Chidjun','Mai Davika|Tao Sattaphong'],
  ['Rain in June','六月雨','movie','Taiwan',2022,8.3,['Romance','Drama'],'A weather presenter and a night bus driver compare the forecasts they never follow.','Mandarin','Huang Xin-ya','Kuan-Ting Liu|Kimi Hsia'],
  ['The Quiet Shore','고요한 해변','movie','Korea',2021,8.2,['Drama','Mystery'],'A diver finds a camera at sea that holds the last day of a missing woman.','Korean','Lim Soo-jin','Han Hyo-joo|Ryu Jun-yeol'],
  ['City of Paper','纸城','movie','China',2021,8.1,['Drama','Urban'],'A young architect draws the city she is about to lose.','Mandarin','Fang Li','Ni Ni|Zhu Yilong'],
  ['The Lantern Keeper','灯守り','movie','Japan',2021,8.0,['Period','Drama'],'On a remote island, a keeper lights one lantern for each person who returns.','Japanese','Akira Watanabe','Sakura Ando|Taiga Nakano'],
  ['Every Last Summer','หน้าร้อนสุดท้าย','movie','Thailand',2020,7.9,['Drama','Romance'],'Two friends spend a summer restoring a shuttered seaside hotel.','Thai','Kornkanok Vichai','Ice Paris|Baifern Pimchanok'],
  ['The Map of Small Things','小事地圖','movie','Taiwan',2020,7.8,['Romance','Drama'],'A mapmaker leaves clues around Taipei for the person she cannot call.','Mandarin','Jia Wei','Vivian Sung|Austin Lin'],
  ['Red Thread','붉은 실','movie','Korea',2020,7.8,['Thriller','Romance'],'A tailor traces a red thread from a missing coat to a decades-old promise.','Korean','Kang Mira','Kim Go-eun|Yim Si-wan'],
  ['The River Between','两岸之间','movie','China',2019,7.9,['Family','Drama'],'Two brothers ferry their father’s piano across a river that keeps rising.','Mandarin','Wei Lin','Xu Zheng|Zhang Ziyi'],
  ['Still Walking Home','歩いて帰る','movie','Japan',2019,8.2,['Family','Drama'],'A son takes the long way home after his mother leaves him a key.','Japanese','Hirokazu Sato','Kasumi Arimura|Koji Yakusho'],
  ['Second Balcony','ระเบียงสอง','movie','Thailand',2019,7.6,['Romance','Comedy'],'A florist and a building manager fall in love across two balconies.','Thai','Somchai Rattan','Mew Nittha|James Jirayu'],
  ['East of the River','河東','movie','Taiwan',2019,7.7,['Crime','Drama'],'A detective returns to his hometown to close the case that made him leave.','Mandarin','Cheng Hao','Chang Chen|Gwei Lun-mei'],
  ['The Sea at 4AM','새벽 네 시의 바다','movie','Korea',2017,8.0,['Romance','Drama'],'A night fisherman lets a visitor borrow his boat until sunrise.','Korean','Lee Hyeon','Park Bo-young|Yoo Ah-in'],
  ['Winter Plum','冬梅','movie','China',2017,7.8,['Period','Romance'],'A florist in a frozen village waits for spring and a letter from the capital.','Mandarin','Qin Yue','Zhao Liying|Deng Chao'],
  ['After the Rain Stops','雨が止んだら','movie','Japan',2017,8.1,['Drama','Romance'],'A novelist and a young baker meet under the same awning every Thursday.','Japanese','Miki Arai','Nana Komatsu|Kento Yamazaki'],
  ['The Last Songbird','นกเพลงสุดท้าย','movie','Thailand',2017,7.9,['Music','Drama'],'A singer returns to the neighborhood stage where her career began.','Thai','Pim Srisai','Urassaya Sperbund|Mario Maurer'],
  ['The Borrowed Room','借來的房間','movie','Taiwan',2017,7.6,['Mystery','Drama'],'A house sitter discovers the rooms change when nobody is looking.','Mandarin','Lu Mei','Kuan-Ting Liu|Tiffany Ann Hsu'],
  ['Nocturne for Two','둘을 위한 녹턴','movie','Korea',2016,7.7,['Music','Romance'],'A pianist rehearses for an empty hall while an old friend listens from the dark.','Korean','Seo Yuna','Kim Nam-gil|Jeon Do-yeon'],
  ['The Postcard Season','明信片季節','movie','Taiwan',2016,7.5,['Romance','Family'],'A postcard collector visits every address she never sent one to.','Mandarin','Hsu Chia','Ariel Lin|Chen Bo-lin'],
];

export const titles: Title[] = records.map((r, i) => {
  const [title, originalTitle, type, country, year, rating, genres, description, language, director, cast] = r;
  return { id: `as-${String(i + 1).padStart(3,'0')}`, title, originalTitle, type, country, year, rating, genres, description, language, director, cast: cast.split('|'), status: type === 'series' && i % 4 === 0 ? 'Ongoing' : 'Completed', seasons: type === 'series' ? (i % 3) + 1 : 0, episodes: type === 'series' ? 8 + (i % 8) : 1, popularity: 95 - ((i * 7) % 58), poster: poster(title, i), backdrop: poster(title, i, true), trailer: 'https://storage.googleapis.com/coverr-main/mp4/Mt_Baker.mp4', hd: i % 3 === 0 ? '4K' : 'HD' };
});
export const countries: Country[] = ['Korea','China','Japan','Thailand','Taiwan'];
export const genres = Array.from(new Set(titles.flatMap(t => t.genres))).sort();
export const getTitle = (id?: string) => titles.find(t => t.id === id);
export const byCountry = (country: Country) => titles.filter(t => t.country === country);