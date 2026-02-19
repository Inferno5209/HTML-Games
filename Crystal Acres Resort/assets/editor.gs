
/**
 * CMS BACKEND - ADVANCED EDITION
 * Handles all logic related to managing website text content.
 * FEATURES:
 * - Vertical Lists Side-by-Side Storage
 * - Batch Updating (Performance & Stability)
 * - Self-Healing Row Creation
 * - Timestamp Logging
 */

var CmsBackend = {

  SPREADSHEET_ID: "1uNvHz_xEDkA_A43kPQz08-vRdmx7oFhZkkwNwI29mb8",
  SHEET_NAME: "SiteContent",

  // Configuration of where each page lives (1-based index)
  PAGE_COLUMNS: {
    'home': 1,      // A-B
    'villa': 4,     // D-E
    'browncamp': 7, // G-H
    'shanty': 10,   // J-K
    'bunkhouse': 13 // M-N
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
    else if (action === 'setup') {
      return this.setup();
    }
  },

  getContent: function (page) {
    if (!page) return createOutput("Error", "Missing page name");
    
    // Check Cache
    const cacheKey = `content_${page}`;
    const cache = CacheService.getScriptCache();
    const cachedContent = cache.get(cacheKey);

    if (cachedContent) {
      return createOutput("Success", JSON.parse(cachedContent));
    }

    const startCol = this.PAGE_COLUMNS[page];
    if (!startCol) return createOutput("Error", "Unknown page section");

    const sheet = this.getMasterSheet();
    const lastRow = sheet.getLastRow(); 
    
    // Safety check: If sheet is empty (just headers or less), return defaults
    if (lastRow < 3) {
         if (DEFAULTS[page]) return createOutput("Success", DEFAULTS[page]);
         return createOutput("Success", {});
    }

    // Get Cols (Key, Value) from Row 3 down
    const range = sheet.getRange(3, startCol, lastRow - 2, 2); 
    const data = range.getValues();
    
    const contentMap = {};
    for (let i = 0; i < data.length; i++) {
        const key = data[i][0];
        const val = data[i][1];
        if (key) {
            contentMap[key] = val;
        }
    }

    // Default Fallback
    if (Object.keys(contentMap).length === 0 && DEFAULTS[page]) {
        return createOutput("Success", DEFAULTS[page]);
    }

    CacheService.getScriptCache().put(cacheKey, JSON.stringify(contentMap), 3600);
    return createOutput("Success", contentMap);
  },

  /**
   * Single Update - Wrapper for Batch with 1 item
   */
  updateContent: function (page, elementId, content) {
    const updates = {};
    updates[elementId] = content;
    return this.updateContentBatch(page, updates);
  },

  /**
   * BATCH UPDATE - The "Advanced" Engine
   * Updates multiple fields at once. 
   * More efficient and robust.
   */
  updateContentBatch: function(page, updates) {
    if (!page || !updates) return createOutput("Error", "Missing parameters");
    
    const startCol = this.PAGE_COLUMNS[page];
    if (!startCol) return createOutput("Error", "Unknown page section");

    const sheet = this.getMasterSheet();
    
    // Invalidate Cache
    CacheService.getScriptCache().remove(`content_${page}`);

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
                keys[emptyIndex] = key; // Reserve this slot in our memory map!
            }
        }

        // 3. Append if still not found
        if (targetRow === -1) {
            targetRow = keys.length + 3;
            keys.push(key); // Extend memory map
        }

        // Write
        // Ensure row exists
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
    const sheet = this.getMasterSheet();
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
        const startCol = this.PAGE_COLUMNS[page];
        const color = colors[page];
        const data = DEFAULTS[page];

        // 1. Section Header (Row 1, Merged)
        const sectionHeader = sheet.getRange(1, startCol, 1, 2);
        sectionHeader.merge();
        sectionHeader.setValue(page.toUpperCase());
        sectionHeader.setFontWeight("bold");
        sectionHeader.setHorizontalAlignment("center");
        sectionHeader.setBackground(color);
        sectionHeader.setBorder(true, true, true, true, false, false);

        // 2. Col Headers (Row 2)
        sheet.getRange(2, startCol).setValue("ID").setFontWeight("bold").setBackground("#f8f9fa");
        sheet.getRange(2, startCol + 1).setValue("Content").setFontWeight("bold").setBackground("#f8f9fa");

        // 3. Values (Row 3+)
        const entries = Object.entries(data);
        if (entries.length > 0) {
            sheet.getRange(3, startCol, entries.length, 2).setValues(entries);
        }
        
        // Resize Cols
        sheet.setColumnWidth(startCol, 150); // ID
        sheet.setColumnWidth(startCol + 1, 300); // Content
        
        // Visual Gap Column (C, F, I, L, O)
        // startCol + 2 is the column after the pair.
        try {
            sheet.setColumnWidth(startCol + 2, 100); // Wider gap
            // Fill with a space " " from Row 2 down to the bottom
            const maxRows = sheet.getMaxRows();
            if (maxRows > 1) {
                sheet.getRange(2, startCol + 2, maxRows - 1, 1).setValue(" ");
                sheet.getRange(2, startCol + 2, maxRows - 1, 1).setBackground(null); // Clean visual
            }
        } catch (e) {
            // Ignore if out of bounds (though it shouldn't be)
        }
    });

    sheet.setFrozenRows(2);
    
    // Clear All Caches
    const cache = CacheService.getScriptCache();
    pages.forEach(p => cache.remove(`content_${p}`));

    return createOutput("Success", "Database Initialized: Vertical Sections Layout");
  },

  getMasterSheet: function () {
    let ss;
    try {
      if (this.SPREADSHEET_ID) ss = SpreadsheetApp.openById(this.SPREADSHEET_ID);
      else ss = SpreadsheetApp.getActiveSpreadsheet();
    } catch (e) {
      ss = SpreadsheetApp.getActiveSpreadsheet();
    }

    let sheet = ss.getSheetByName(this.SHEET_NAME);
    if (!sheet) {
      sheet = ss.insertSheet(this.SHEET_NAME);
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
    'info-location-text': 'Gilmanton Iron Works is conveniently located in New Hampshire\'s Lakes Region...',
    'info-fishing-title': 'Fishing',
    'info-fishing-text': 'In New Hampshire, anyone 16 years or older is required to have a valid fishing license...',
    'info-boating-title': 'Boating',
    'info-boating-text': 'If you plan on bringing a motor boat, please be aware of the laws...',
    'things-intro': 'Nestled between the mountains and lakes, New Hampshire\'s Lakes Region...',
    'things-hiking-title': 'Hiking',
    'things-hiking-text': 'Hiking in New Hampshire\'s Lakes Region offers a perfect mix...',
    'things-shop-title': 'Shopping & Amusements',
    'things-shop-text': 'The Lakes Region of New Hampshire offers plenty of shopping and amusements...',
    'things-white-title': 'White Mountains',
    'things-white-text': 'The White Mountains offer endless opportunities for adventure...',
    'history-intro': 'Crystal Acres Resort has been at the heart of our family since 1898...',
    'history-bunk-title': 'The Bunkhouse - A Living Time Capsule',
    'history-bunk-text': 'Built in 1936, The Bunkhouse is a remarkable piece of Crystal Acres Resort history...',
    'history-legacy-title': 'A Legacy of Family Memories',
    'history-legacy-text': 'For over 125 years, Crystal Acres Resort has been a place where families reconnect...',
    'cottage-intro': 'Each of our unique cottages offers its own charm and character...',
    'cottage-villa-desc': 'This cozy cottage has the best view of the lake...',
    'cottage-brown-desc': 'A spacious cottage with 3 bedrooms...',
    'cottage-shanty-desc': 'Set back from the others, the Shanty is a cute, rustic getaway...',
    'cottage-bunk-desc': 'Built in 1936 with historic signatures from the 1930s...',
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
    'shanty-desc-p2': 'The Shanty features screened porches that provide wonderful spaces to enjoy the outdoors while protected from bugsperfect for morning breakfast, afternoon reading, or evening card games. Inside, you\'ll find a cozy fireplace that creates the quintessential cabin atmosphere, especially wonderful during cooler spring and fall evenings.',
    'shanty-desc-p3': 'With two comfortable bedrooms sleeping up to 6 guests, The Shanty strikes the perfect balance between intimate and spacious. Its slightly set-back location offers a sense of peaceful retreat, making it ideal for families who want a quiet escape while still having easy access to all the lakefront activities. The rustic charm and comfortable amenities make The Shanty a perennial favorite among returning guests.',
    'shanty-cta-title': 'Ready to Book Your Stay?',
    'shanty-cta-text': 'Experience the historic charm of The Shanty.'
  },
  'bunkhouse': {
    'bunk-tagline': 'Classic Camp Atmosphere',
    'bunk-highlights-title': 'About The Bunkhouse',
    'bunk-desc-p1': 'The Bunkhouse is a living piece of Crystal Acres history, built in 1936 and preserved with its original camp cabin charm. This special accommodation is available as an add-on only when you book one of our main cottages, making it perfect for larger family gatherings or groups who need extra sleeping space.',
    'bunk-notice': 'Important: The Bunkhouse can only be rented as an add-on to The Villa, Brown Camp, or Shanty. It is not available as a standalone rental.',
    'bunk-charm-title': 'Historic Charm & Character',
    'bunk-desc-p2': 'Step into authentic 1930s camp history with The Bunkhouse. The wood-paneled walls throughout create a warm, rustic atmosphere that has welcomed generations of families. Most remarkably, the walls still bear historic signatures from campers who stayed here in the 1930s, offering a tangible connection to the property\'s rich past.',
    'bunk-kids-title': 'Perfect for Kids & Teens',
    'bunk-desc-p3': 'The Bunkhouse provides a unique experience that kids and teenagers especially love. It offers them a sense of independence and adventure while remaining close to the main cottage. The authentic camp cabin atmosphere makes it feel like a special retreat within your family vacation, creating memories that will last a lifetime.',
    'bunk-cta-title': 'Add The Bunkhouse to Your Stay',
    'bunk-cta-text': 'Enhance your family gathering with this historic add-on.'
  }
};
