/**
 * CMS BACKEND - ADVANCED EDITION
 * Handles all logic related to managing website text content AND styling.
 * FEATURES:
 * - Vertical Lists Side-by-Side Storage
 * - Separate Sheets for Content and Styles
 * - Batch Updating (Performance & Stability)
 * - Self-Healing Row Creation
 * - Timestamp Logging
 */

var CmsBackend = {

  SPREADSHEET_ID: "1uNvHz_xEDkA_A43kPQz08-vRdmx7oFhZkkwNwI29mb8",
  CONTENT_SHEET_NAME: "SiteContent",
  STYLES_SHEET_NAME: "SiteStyles",

  // Configuration of where each page lives (1-based index). Content uses 3 cols (ID, Content, Gap)
  CONTENT_COLUMNS: {
    'home': 1,
    'villa': 4,
    'browncamp': 7,
    'shanty': 10,
    'bunkhouse': 13
  },

  // Styles uses 4 cols (Type, Target, Styles, Gap)
  STYLE_COLUMNS: {
    'home': 1,
    'villa': 5,
    'browncamp': 9,
    'shanty': 13,
    'bunkhouse': 17
  },

  handleRequest: function (params) {
    const action = params.action;

    if (action === 'getContent') {
      return this.getContent(params.page);
    }
    else if (action === 'updateContent') {
      return this.updateContent(params.page, params.elementId, params.content);
    }
    else if (action === 'updateContentBatch') {
      return this.updateContentBatch(params.page, params.updates);
    }
    else if (action === 'updateStylesBatch') {
      return this.updateStylesBatch(params.page, params.styleUpdates);
    }
    else if (action === 'setup') {
      return this.setup();
    }
  },

  getContent: function (page) {
    if (!page) return createOutput("Error", "Missing page name");
    
    // Check Cache
    const contentCacheKey = `content_${page}`;
    const styleCacheKey = `style_${page}`;
    const cache = CacheService.getScriptCache();
    
    let contentMap = {};
    let styleArr = [];

    const cachedContent = cache.get(contentCacheKey);
    const cachedStyles = cache.get(styleCacheKey);

    if (cachedContent && cachedStyles) {
      return createOutput("Success", { 
        content: JSON.parse(cachedContent), 
        styles: JSON.parse(cachedStyles) 
      });
    }

    const startColContent = this.CONTENT_COLUMNS[page];
    if (!startColContent) return createOutput("Error", "Unknown page section");

    // --- GET CONTENT ---
    const contentSheet = this.getMasterSheet(this.CONTENT_SHEET_NAME);
    const contentLastRow = contentSheet.getLastRow(); 
    
    if (contentLastRow >= 3) {
      const data = contentSheet.getRange(3, startColContent, contentLastRow - 2, 2).getValues();
      for (let i = 0; i < data.length; i++) {
          if (data[i][0]) contentMap[data[i][0]] = data[i][1];
      }
    }
    
    // Default Fallback
    if (Object.keys(contentMap).length === 0 && DEFAULTS[page]) {
        contentMap = DEFAULTS[page];
    }

    // --- GET STYLES ---
    const styleSheet = this.getMasterSheet(this.STYLES_SHEET_NAME);
    const startColStyle = this.STYLE_COLUMNS[page];
    const styleLastRow = styleSheet.getLastRow();
    
    if (styleLastRow >= 3) {
      const sData = styleSheet.getRange(3, startColStyle, styleLastRow - 2, 3).getValues();
      for (let i = 0; i < sData.length; i++) {
          if (sData[i][0] && sData[i][1]) {
             try { 
                 styleArr.push({ type: sData[i][0], target: sData[i][1], styles: JSON.parse(sData[i][2] || "{}") });
             } catch(e) {}
          }
      }
    }

    // Save to Cache
    cache.put(contentCacheKey, JSON.stringify(contentMap), 3600);
    cache.put(styleCacheKey, JSON.stringify(styleArr), 3600);
    
    return createOutput("Success", { content: contentMap, styles: styleArr });
  },

  updateContent: function (page, elementId, content) {
    const updates = {};
    updates[elementId] = content;
    return this.updateContentBatch(page, updates);
  },

  updateContentBatch: function(page, updates) {
    if (!page || !updates) return createOutput("Error", "Missing parameters");
    
    // Ensure all content is stripped of HTML before saving
    const sanitizedUpdates = {};
    for (const [k, v] of Object.entries(updates)) {
        // Create a simple regex to strip tags, ensuring strictly plain text
        sanitizedUpdates[k] = v.replace(/<[^>]*>?/gm, '');
    }
    return this._batchUpdate(page, sanitizedUpdates, this.CONTENT_SHEET_NAME, `content_${page}`, this.CONTENT_COLUMNS[page]);
  },

  updateStylesBatch: function(page, styleUpdates) {
    if (!page || !styleUpdates || !Array.isArray(styleUpdates)) return createOutput("Error", "Missing parameters or invalid styles format");
    
    const startCol = this.STYLE_COLUMNS[page];
    if (!startCol) return createOutput("Error", "Unknown page section");

    const sheet = this.getMasterSheet(this.STYLES_SHEET_NAME);
    CacheService.getScriptCache().remove(`style_${page}`);

    const lastRow = sheet.getLastRow();
    let existingData = [];
    if (lastRow >= 3) {
        existingData = sheet.getRange(3, startCol, lastRow - 2, 2).getValues(); // Get Type and Target
    }

    // Map existing composite keys
    const existingKeys = existingData.map(row => row[0] + "||" + row[1]); 

    for (const update of styleUpdates) {
        if (!update.type || !update.target) continue;
        const compKey = update.type + "||" + update.target;
        let targetRow = -1;
        
        const keyIndex = existingKeys.indexOf(compKey);
        if (keyIndex !== -1) {
            targetRow = keyIndex + 3;
        } else {
            const emptyIndex = existingKeys.indexOf("||");
            if (emptyIndex !== -1) {
                targetRow = emptyIndex + 3;
                existingKeys[emptyIndex] = compKey;
            } else {
                targetRow = existingKeys.length + 3;
                existingKeys.push(compKey);
            }
        }

        if (targetRow > sheet.getMaxRows()) sheet.insertRowAfter(sheet.getMaxRows());

        sheet.getRange(targetRow, startCol).setValue(update.type).setFontWeight("bold");
        sheet.getRange(targetRow, startCol + 1).setValue(update.target).setFontWeight("bold");
        sheet.getRange(targetRow, startCol + 2).setValue(JSON.stringify(update.styles || {}));
        sheet.getRange(targetRow, startCol + 2).setNote("Updated: " + new Date().toLocaleTimeString());
    }

    return createOutput("Success", "Style batch saved successfully");
  },

  _batchUpdate: function(page, updates, sheetName, cacheKey, startCol) {
    const sheet = this.getMasterSheet(sheetName);
    
    // Invalidate Cache
    CacheService.getScriptCache().remove(cacheKey);

    // Get ALL existing keys in this section to map them
    const lastRow = sheet.getLastRow();
    let keys = [];
    if (lastRow >= 3) {
        keys = sheet.getRange(3, startCol, lastRow - 2, 1).getValues().flat();
    }

    // Process each update
    for (const [key, value] of Object.entries(updates)) {
        let targetRow = -1;

        // 1. Find existing
        const keyIndex = keys.indexOf(key);
        if (keyIndex !== -1) {
            targetRow = keyIndex + 3; // +3 offset
        }

        // 2. Find empty slot if not found
        if (targetRow === -1) {
            const emptyIndex = keys.indexOf("");
            if (emptyIndex !== -1) {
                targetRow = emptyIndex + 3;
                keys[emptyIndex] = key; // Reserve slot
            }
        }

        // 3. Append if still not found
        if (targetRow === -1) {
            targetRow = keys.length + 3;
            keys.push(key); 
        }

        // Write
        if (targetRow > sheet.getMaxRows()) {
            sheet.insertRowAfter(sheet.getMaxRows());
        }

        const valueCol = startCol + 1;
        sheet.getRange(targetRow, startCol).setValue(key).setFontWeight("bold");
        sheet.getRange(targetRow, valueCol).setValue(value);
        sheet.getRange(targetRow, valueCol).setNote("Updated: " + new Date().toLocaleTimeString()); // Timestamp
    }

    return createOutput("Success", "Batch saved successfully");
  },

  setup: function() {
    this._setupContentSheet();
    this._setupStylesSheet();
    
    // Clear All Caches
    const pages = ['home', 'villa', 'browncamp', 'shanty', 'bunkhouse'];
    const cache = CacheService.getScriptCache();
    pages.forEach(p => {
       cache.remove(`content_${p}`);
       cache.remove(`style_${p}`);
    });

    return createOutput("Success", "Database Initialized: Plain Text & Advanced Styles");
  },

  _setupContentSheet: function() {
    const sheet = this.getMasterSheet(this.CONTENT_SHEET_NAME);
    sheet.clear(); 

    const pages = ['home', 'villa', 'browncamp', 'shanty', 'bunkhouse'];
    const colors = {
        'home': '#cce5ff',     // Blue
        'villa': '#d4edda',    // Green
        'browncamp': '#f8d7da',// Red
        'shanty': '#fff3cd',   // Yellow
        'bunkhouse': '#e2e3e5' // Grey
    };

    pages.forEach(page => {
        const startCol = this.CONTENT_COLUMNS[page];
        const color = colors[page];
        const data = DEFAULTS[page] || {};

        // 1. Section Header (Row 1, Merged)
        const sectionHeader = sheet.getRange(1, startCol, 1, 2);
        sectionHeader.merge();
        sectionHeader.setValue(page.toUpperCase() + " CONTENT");
        sectionHeader.setFontWeight("bold");
        sectionHeader.setHorizontalAlignment("center");
        sectionHeader.setBackground(color);
        sectionHeader.setBorder(true, true, true, true, false, false);

        // 2. Col Headers (Row 2)
        sheet.getRange(2, startCol).setValue("ID").setFontWeight("bold").setBackground("#f8f9fa");
        sheet.getRange(2, startCol + 1).setValue("Plain Text").setFontWeight("bold").setBackground("#f8f9fa");

        // 3. Values (Row 3+)
        const entries = Object.entries(data);
        if (entries.length > 0) {
            sheet.getRange(3, startCol, entries.length, 2).setValues(entries);
        }
        
        // Resize Cols
        sheet.setColumnWidth(startCol, 150); // ID
        sheet.setColumnWidth(startCol + 1, 300); // Content
        
        // Visual Gap Column
        try {
            sheet.setColumnWidth(startCol + 2, 100); 
            const maxRows = sheet.getMaxRows();
            if (maxRows > 1) {
                sheet.getRange(2, startCol + 2, maxRows - 1, 1).setValue(" ");
                sheet.getRange(2, startCol + 2, maxRows - 1, 1).setBackground(null);
            }
        } catch (e) {}
    });

    sheet.setFrozenRows(2);
  },

  _setupStylesSheet: function() {
    const sheet = this.getMasterSheet(this.STYLES_SHEET_NAME);
    sheet.clear(); 

    const pages = ['home', 'villa', 'browncamp', 'shanty', 'bunkhouse'];
    const colors = {
        'home': '#cce5ff',     // Blue
        'villa': '#d4edda',    // Green
        'browncamp': '#f8d7da',// Red
        'shanty': '#fff3cd',   // Yellow
        'bunkhouse': '#e2e3e5' // Grey
    };

    pages.forEach(page => {
        const startCol = this.STYLE_COLUMNS[page];
        const color = colors[page];

        // 1. Section Header (Row 1, Merged over 3 columns)
        const sectionHeader = sheet.getRange(1, startCol, 1, 3);
        sectionHeader.merge();
        sectionHeader.setValue(page.toUpperCase() + " STYLES");
        sectionHeader.setFontWeight("bold");
        sectionHeader.setHorizontalAlignment("center");
        sectionHeader.setBackground(color);
        sectionHeader.setBorder(true, true, true, true, false, false);

        // 2. Col Headers (Row 2)
        sheet.getRange(2, startCol).setValue("Type (Section/Text)").setFontWeight("bold").setBackground("#f8f9fa");
        sheet.getRange(2, startCol + 1).setValue("Target").setFontWeight("bold").setBackground("#f8f9fa");
        sheet.getRange(2, startCol + 2).setValue("JSON Styles").setFontWeight("bold").setBackground("#f8f9fa");

        // Resize Cols
        sheet.setColumnWidth(startCol, 150);     // Type
        sheet.setColumnWidth(startCol + 1, 150); // Target
        sheet.setColumnWidth(startCol + 2, 250); // Styles
        
        // Visual Gap Column
        try {
            sheet.setColumnWidth(startCol + 3, 100); 
            const maxRows = sheet.getMaxRows();
            if (maxRows > 1) {
                sheet.getRange(2, startCol + 3, maxRows - 1, 1).setValue(" ");
                sheet.getRange(2, startCol + 3, maxRows - 1, 1).setBackground(null);
            }
        } catch (e) {}
    });

    sheet.setFrozenRows(2);
  },

  getMasterSheet: function (sheetName) {
    let ss;
    try {
      if (this.SPREADSHEET_ID) ss = SpreadsheetApp.openById(this.SPREADSHEET_ID);
      else ss = SpreadsheetApp.getActiveSpreadsheet();
    } catch (e) {
      ss = SpreadsheetApp.getActiveSpreadsheet();
    }

    let sheet = ss.getSheetByName(sheetName);
    if (!sheet) {
      sheet = ss.insertSheet(sheetName);
    }
    return sheet;
  }
};

/** 
 * COMPREHENSIVE CONTENT DEFAULTS 
 */
var DEFAULTS = {
  'home': {
    'home-hero-title': 'Welcome to Crystal Acres Resort',
    'home-hero-subtitle': 'Your Lakeside Retreat Since 1898',
    'home-opening-p1': 'Welcome to Crystal Acres Resort, a family-owned gem nestled in the heart of Gilmanton Iron Works, New Hampshire. Our cottages offer a nostalgic escape, reminiscent of the family cabin you visited as a child. With three charming, and unique cottages for rent, each one is a peaceful retreat where you can unwind and create lasting memories.',
    'home-opening-p2': 'It is just a short walk from the cottages down the hill to the lake and beach. The ample lakefront is shared with the renters in our other two cottages. Our property boasts 200 feet of pristine sandy beach, with a delightful mix of sun and shade, perfect for lounging or enjoying a swim in the crystal-clear lake. The view of the Belknap Mountain Range adds a breathtaking backdrop for your getaway. Whether you\'re looking for adventure or relaxation, we offer an abundance of activities to suit all ages. The lake temperature typically hovers in the 70s and 80s, making it ideal for swimming and water fun. Take advantage of our three piers, raft, and a selection of boats, including canoes, kayaks, rowboats, and a paddleboat—all available for your enjoyment. If you own any boats you would like to bring up, including motor boats, you are welcome to bring them along. There is a town boat launch conveniently just down the road and our piers are equipped for docking boats. After the sun goes down, enjoy stargazing and listening to the loons call while enjoying a fire on the beach in one of our two portable firepits.',
    'home-opening-p3': 'The property is located on the southern shore of Crystal lake facing north, which offers the rare treat of watching both the sunrise and sunset over the sparkling waters of Crystal Lake. Each cottage is thoughtfully spaced apart, providing privacy and its own dedicated parking, while a shared wood shed ensures guests have easy access to firewood for cozy evenings by the fireplace. The property also features a shuffleboard court and plenty of open space for yard games, making it easy to gather for friendly competition or play. With no roads to cross between the cottages and the shoreline, Crystal Acres Resort is especially safe for children, allowing families to enjoy the lake and grounds with peace of mind.',
    'home-opening-p4': 'We have the perfect setting for family reunions. Our three cottages allow for personal space, while the grounds and lake inspire group activities and family bonding. If you need a little more room, we have a Bunk House that sleeps four. It is a favorite among teens and older kids. With the owners living on the property, there\'s always someone available to assist you during your stay. You\'ll enjoy the comfort of knowing we\'re here to ensure you have everything you need.',
    'home-opening-p5': 'We welcome pets at our property so you can enjoy your stay with your furry companions, but an additional fee applies. For the comfort and safety of all guests, dogs must be kept on leashes while on the grounds and owners are expected to clean up after their pets. Please note that any damage caused by pets is the financial responsibility of the owner, and we kindly ask that pets be well-behaved and respectful of the cottages and surrounding property.',
    'home-opening-p6': 'Crystal Lake is a 455-acre lake known for it\'s clean water quality. The lake offers scenic views of Belknap Mountain and Mount Major. It is a year-round recreation hub, with summer activities like boating, kayaking, sailing, swimming, and community events such as boat parades and fireworks, while winter brings ice fishing. Anglers enjoy catching rainbow trout, bass, pickerel, and perch, and the lake is also an important breeding ground for loons, bald eagles, herons, and other wildlife, with occasional visits from moose, otters, and beavers.',
    'home-opening-p7': 'Situated conveniently close to the popular destinations of Lake Winnipesaukee, Laconia, Alton, and Tilton, Crystal Acres Resort is the perfect place to escape, reconnect with loved ones, and enjoy the best of New Hampshire\'s natural beauty. Come experience a timeless retreat at Crystal Acres Resort.',
    'info-location-title': 'Location',
    'info-location-text': 'Gilmanton Iron Works is conveniently located in New Hampshire\'s Lakes Region, offering easy access to both the mountains and the seacoast. The village is about 2 hours from Boston, 1 hour 20 minutes from North Conway, 30 minutes from Concord, and a little over 1 hour from Portsmouth. Closer by, the town of Alton is only about 15 minutes away, while Laconia is around 25 minutes. In Alton, visitors will find a Hannaford supermarket along with several dining options, including Shibley\'s at the Pier overlooking Lake Winnipesaukee, the cozy J.P. China offering Asian cuisine, and Dockside Café for casual lakeside meals. In Laconia, there are larger shopping options, including a Walmart Supercenter, Market Basket, and Hannaford. For spirits and fine wines, the nearest New Hampshire State Liquor & Wine Outlet is in Gilford, about 30 minutes from Gilmanton Iron Works. Together, these nearby towns ensure that anyone staying in the area has quick access to groceries, restaurants, everyday essentials, and specialty shopping all within a short drive.',
    'info-fishing-title': 'Fishing',
    'info-fishing-text': 'In New Hampshire, anyone 16 years or older is required to have a valid fishing license to fish in the state\'s lakes, rivers, and streams, including Crystal Lake. Licenses help support fisheries management, conservation programs, and access to public waters. The process is simple: you can purchase a license online through the New Hampshire Fish & Game Department website, or in person at many town halls, sporting goods stores, or Fish & Game offices. Options include short-term, annual, and combination hunting/fishing licenses, with discounted rates available for New Hampshire residents. Always be sure to carry your license while fishing, as conservation officers may ask to see it.',
    'info-boating-title': 'Boating',
    'info-boating-text': 'If you plan on bringing a motor boat, please be aware of the laws. The Marine Patrol does come on the lake periodically. In New Hampshire, anyone (must be 16 years or older) operating a motorized boat with more than 25 horsepower (including jet skis) must have a Safe Boating Certificate. Both residents and visitors are required to meet this rule unless they hold a NASBLA-approved boating certificate from another state or a valid U.S. Coast Guard license. To get certified, boaters must complete a state-approved safety course—either online or in person—pass an exam, and then carry the certificate while operating a vessel. This ensures safe and responsible boating on New Hampshire\'s waterways. More information on requirements and approved courses can be found on the New Hampshire Marine Patrol website.',
    'things-intro': 'Nestled between the mountains and lakes, New Hampshire\'s Lakes Region and nearby White Mountains provide visitors with endless opportunities for outdoor adventure, family fun, and local charm. From hiking trails that climb to breathtaking vistas, to vibrant shopping villages, arcades, and nature centers, the region offers something for every interest and age group. Just a short drive from Gilmanton Iron Works, guests can spend the morning exploring mountain summits, the afternoon browsing unique shops or enjoying lakeside amusements, and the evening relaxing by the water. Whether you\'re seeking scenic beauty, exciting attractions, or memorable day trips, this area is a true four-season destination that highlights the best of New England.',
    'things-hiking-title': 'Hiking',
    'things-hiking-text': 'Hiking in New Hampshire\'s Lakes Region offers a perfect mix of sparkling lake views, rolling hills, and mountain summits, making it a favorite destination for outdoor enthusiasts. Trails range from easy family-friendly walks to more challenging climbs, many with sweeping views of Lake Winnipesaukee, the Belknaps, and beyond. Near Gilmanton, hikers can enjoy a variety of options: Mount Major in Alton (3.2-mile loop) is one of the most popular hikes in the state, rewarding with panoramic views of Lake Winnipesaukee; Belknap Mountain in Gilford (3.5 miles round trip) features a fire tower at the summit with 360-degree vistas; Gunstock Mountain (5 miles via the Ridge Trail) offers moderate climbing with scenic overlooks of the lake and Ossipee range; Lockes Hill in Gilford (1.8-mile loop) is an easier trail with interpretive signs and beautiful views of Winnipesaukee; and Straightback Mountain in Alton (about 5 miles round trip) provides a quieter alternative to Mount Major with equally impressive summit views. Together, these hikes showcase the natural beauty and variety of the Lakes Region, making it a hiker\'s paradise just minutes from Gilmanton.',
    'things-shop-title': 'Shopping & Amusements',
    'things-shop-text': 'The Lakes Region of New Hampshire offers plenty of shopping and amusements, blending local charm with family fun. In Meredith, the Mill Falls Marketplace features a collection of boutique shops, galleries, and cafés housed in restored 19th-century mill buildings along the lake. Nearby in Tilton, the Tanger Outlets provide a wide variety of brand-name stores for bargain hunters. For a mix of fun and nostalgia, Funspot in Laconia—the world\'s largest arcade—offers classic pinball, video games, and bowling. In Weirs Beach, visitors can explore souvenir shops and enjoy arcades, restaurants, and boardwalk attractions along the shore of Lake Winnipesaukee. For a more nature-focused experience, the Squam Lakes Natural Science Center in Holderness combines live animal exhibits, walking trails, and interactive learning to showcase New Hampshire\'s wildlife and natural environment. Together, these destinations make the Lakes Region a lively spot for both shopping and entertainment.',
    'things-white-title': 'White Mountains',
    'things-white-text': 'The White Mountains offer endless opportunities for adventure and sightseeing, and several of the region\'s highlights are just a short drive from Gilmanton Iron Works. A favorite destination is Mount Washington—the tallest peak in the Northeast—where visitors can drive the Auto Road, ride the Cog Railway, or hike to the summit; it\'s about 1 hour 45 minutes away. For family fun, Story Land in Glen provides rides and attractions inspired by fairy tales, perfect for kids, and is roughly 1 hour 30 minutes away. Nature lovers can explore Franconia Notch State Park, home to the Flume Gorge, Echo Lake, and the Cannon Mountain Aerial Tramway, located about 1 hour 40 minutes away. Another must-see is Crawford Notch State Park, offering scenic waterfalls and hiking trails just 1 hour 45 minutes away. Finally, the charming town of North Conway, about 1 hour 20 minutes away, is known for its outlet shopping, restaurants, and easy access to hiking and skiing. Together, these destinations make the White Mountains a perfect day trip from Gilmanton Iron Works.',
    'history-intro': 'Crystal Acres Resort has been at the heart of our family since 1898, making it a treasured piece of New Hampshire\'s Lakes Region heritage. For over a century, this beautiful lakeside property has been passed down through generations, preserving its natural beauty and welcoming spirit. We have been sharing this very special place with the public since the 1940\'s, allowing countless families to create their own cherished memories on the shores of Crystal Lake.',
    'history-bunk-title': 'The Bunkhouse - A Living Time Capsule',
    'history-bunk-text': 'Built in 1936, The Bunkhouse is a remarkable piece of Crystal Acres Resort history that has been preserved with its original camp cabin charm. Step inside and you\'ll discover wood-paneled walls that still bear historic signatures from campers who stayed here in the 1930s, offering a tangible connection to nearly a century of lakeside summers. This authentic structure provides a glimpse into what summer camp life was like in the early 20th century, when families first began making Crystal Acres Resort their vacation destination.\n\nThe Bunkhouse has always been a favorite among children and teenagers, providing generations of young visitors with a sense of independence and adventure. Unlike the main cottages, it maintains its original 1936 simplicity—no modern amenities, just the pure camp experience that has delighted kids for decades. Today, it continues this tradition as an add-on accommodation, perfect for larger family gatherings who want to share in this authentic piece of history.',
    'history-legacy-title': 'A Legacy of Family Memories',
    'history-legacy-text': 'For over 125 years, Crystal Acres Resort has been a place where families reconnect with nature, with each other, and with simpler times. From the early days when our family first fell in love with Crystal Lake, through the 1940s when we began welcoming guests, to today\'s families who return year after year, the property has remained a constant—a peaceful retreat where the beauty of New Hampshire\'s lakes and mountains provides the perfect backdrop for creating lasting memories. We are honored to continue this legacy and share our family\'s treasure with yours.',
    'cottage-intro': 'Each of our unique cottages offers its own charm and character, providing the perfect home away from home for your lakeside retreat.',
    'cottage-villa-desc': 'This cozy cottage has the best view of the lake and lots of convenient amenities. Features screened porch, fireplace, fully equipped kitchen, washer/dryer, and Internet TV.',
    'cottage-brown-desc': 'A spacious cottage with 3 bedrooms, living room, and porch for eating and lounging. Named after Brown University—yes, even though all our cottages are brown!',
    'cottage-shanty-desc': 'Set back from the others, the Shanty is a cute, rustic getaway and a family favorite with an inviting porch for eating or relaxing. Features screened porches and fireplace.',
    'cottage-bunk-desc': 'Built in 1936 with historic signatures from the 1930s still on the walls. Perfect for kids and teens. Can only be rented as an add-on to main cottages.',
    'contact-res-title': 'For Reservations or More Information',
    'contact-res-name': 'Darcy Cloutman',
    'contact-pay-title': 'To Make a Payment',
    'contact-pay-text': 'Art Cloutman\nCrystal Acres LLC\n278 Crystal Lake Road\nGilmanton Iron Works, NH 03837\n603-364-7713',
    'global-footer': '278 Crystal Lake Rd, Gilmanton Iron Works, NH 03837',
    'footer-credit': 'Created by Riley Joseph Santor'
  },
  'villa': {
    'villa-tagline': 'Modern Comfort Meets Lakeside Charm',
    'villa-highlights-title': 'Highlights of the Villa',
    'villa-desc-p1': 'This cozy cottage has the best view of the lake and lots of convenient amenities. The Villa offers modern comfort with a perfect lakeside location, featuring a screened porch ideal for morning coffee or evening relaxation while enjoying stunning water views.',
    'villa-desc-p2': 'Inside, you\'ll find a fully equipped kitchen with all the essentials for preparing meals, a comfortable living room with a fireplace for cozy evenings, and Internet TV for entertainment. The convenience of a washer and dryer makes extended stays effortless, while two well-appointed bedrooms provide restful accommodations for up to 6 guests.',
    'villa-desc-p3': 'The Villa\'s prime location offers unobstructed views of Crystal Lake and the Belknap Mountain Range, making it the perfect retreat for families seeking both comfort and natural beauty. Wake up to breathtaking sunrises and end your days watching spectacular sunsets over the water.',
    'villa-cta-title': 'Ready to Book The Villa?',
    'villa-cta-text': 'Experience the perfect blend of modern comfort and lakeside charm'
  },
  'browncamp': {
    'brown-tagline': 'Classic New England Charm',
    'brown-highlights-title': 'The Brown Camp',
    'brown-desc-p1': 'A spacious cottage with 3 bedrooms, living room, and porch for eating and lounging. Named after Brown University—yes, even though all our cottages are brown! The Brown Camp offers the most sleeping space of our three main cottages, making it ideal for larger families or groups.',
    'brown-desc-p2': 'The generous living room provides ample space for family gatherings, game nights, or simply relaxing together after a day at the lake. The full-length porch serves as an additional living space, perfect for al fresco dining or lounging with a good book while enjoying the fresh mountain air and lake views.',
    'brown-desc-p3': 'With three bedrooms thoughtfully arranged throughout the cottage, families can enjoy both togetherness and privacy. The classic New England camp aesthetic combines with practical amenities to create a comfortable home base for your Crystal Lake vacation. The Brown Camp\'s layout and capacity make it especially popular with multi-generational families and friend groups.',
    'brown-cta-title': 'Ready to Book The Brown Camp?',
    'brown-cta-text': 'Experience classic New England charm with modern comforts'
  },
  'shanty': {
    'shanty-tagline': 'Historic Charm Since the 1930s',
    'shanty-highlights-title': 'About The Shanty',
    'shanty-desc-p1': 'Set back from the others, the Shanty is a cute, rustic getaway and a family favorite with an inviting porch for eating or relaxing. This charming cottage offers a more private, secluded setting while still being just steps away from the lake and beach.',
    'shanty-desc-p2': 'The Shanty features screened porches that provide wonderful spaces to enjoy the outdoors while protected from bugs—perfect for morning breakfast, afternoon reading, or evening card games. Inside, you\'ll find a cozy fireplace that creates the quintessential cabin atmosphere, especially wonderful during cooler spring and fall evenings.',
    'shanty-desc-p3': 'With two comfortable bedrooms sleeping up to 6 guests, The Shanty strikes the perfect balance between intimate and spacious. Its slightly set-back location offers a sense of peaceful retreat, making it ideal for families who want a quiet escape while still having easy access to all the lakefront activities. The rustic charm and comfortable amenities make The Shanty a perennial favorite among returning guests.',
    'shanty-cta-title': 'Ready to Book Your Stay?',
    'shanty-cta-text': 'Experience the historic charm of The Shanty.'
  },
  'bunkhouse': {
    'bunk-tagline': 'Classic Camp Atmosphere',
    'bunk-highlights-title': 'About The Bunkhouse',
    'bunk-desc-p1': 'The Bunkhouse is a living piece of Crystal Acres history, built in 1936 and preserved with its original camp cabin charm. This special accommodation is available as an add-on only when you book one of our main cottages, making it perfect for larger family gatherings or groups who need extra sleeping space.',
    'bunk-charm-title': 'Historic Charm & Character',
    'bunk-desc-p2': 'Step into authentic 1930s camp history with The Bunkhouse. The wood-paneled walls throughout create a warm, rustic atmosphere that has welcomed generations of families. Most remarkably, the walls still bear historic signatures from campers who stayed here in the 1930s, offering a tangible connection to the property\'s rich past.',
    'bunk-kids-title': 'Perfect for Kids & Teens',
    'bunk-desc-p3': 'The Bunkhouse provides a unique experience that kids and teenagers especially love. It offers them a sense of independence and adventure while remaining close to the main cottage. The authentic camp cabin atmosphere makes it feel like a special retreat within your family vacation, creating memories that will last a lifetime.'
  }
};
