export const Filters = [
  {
    id: "type_filters",
    title: "Type Filters",
    filters: [
      {
        id: "category",
        text: "Item Category",
        fullSpan: true,
        option: {
          options: [
            {
              id: null,
              text: "Any",
            },
            {
              id: "weapon",
              text: "Any Weapon",
            },
            {
              id: "weapon.onemelee",
              text: "Any One-Handed Melee Weapon",
            },
            {
              id: "weapon.unarmed",
              text: "Unarmed",
            },
            {
              id: "weapon.claw",
              text: "Claw",
            },
            {
              id: "weapon.dagger",
              text: "Dagger",
            },
            {
              id: "weapon.onesword",
              text: "One-Handed Sword",
            },
            {
              id: "weapon.oneaxe",
              text: "One-Handed Axe",
            },
            {
              id: "weapon.onemace",
              text: "One-Handed Mace",
            },
            {
              id: "weapon.spear",
              text: "Spear",
            },
            {
              id: "weapon.flail",
              text: "Flail",
            },
            {
              id: "weapon.twomelee",
              text: "Any Two-Handed Melee Weapon",
            },
            {
              id: "weapon.twosword",
              text: "Two-Handed Sword",
            },
            {
              id: "weapon.twoaxe",
              text: "Two-Handed Axe",
            },
            {
              id: "weapon.twomace",
              text: "Two-Handed Mace",
            },
            {
              id: "weapon.warstaff",
              text: "Quarterstaff",
            },
            {
              id: "weapon.ranged",
              text: "Any Ranged Weapon",
            },
            {
              id: "weapon.bow",
              text: "Bow",
            },
            {
              id: "weapon.crossbow",
              text: "Crossbow",
            },
            {
              id: "weapon.caster",
              text: "Any Caster Weapon",
            },
            {
              id: "weapon.wand",
              text: "Wand",
            },
            {
              id: "weapon.sceptre",
              text: "Sceptre",
            },
            {
              id: "weapon.staff",
              text: "Staff",
            },
            {
              id: "weapon.rod",
              text: "Fishing Rod",
            },
            {
              id: "armour",
              text: "Any Armour",
            },
            {
              id: "armour.helmet",
              text: "Helmet",
            },
            {
              id: "armour.chest",
              text: "Body Armour",
            },
            {
              id: "armour.gloves",
              text: "Gloves",
            },
            {
              id: "armour.boots",
              text: "Boots",
            },
            {
              id: "armour.quiver",
              text: "Quiver",
            },
            {
              id: "armour.shield",
              text: "Shield",
            },
            {
              id: "armour.focus",
              text: "Focus",
            },
            {
              id: "armour.buckler",
              text: "Buckler",
            },
            {
              id: "accessory",
              text: "Any Accessory",
            },
            {
              id: "accessory.amulet",
              text: "Amulet",
            },
            {
              id: "accessory.belt",
              text: "Belt",
            },
            {
              id: "accessory.ring",
              text: "Ring",
            },
            {
              id: "gem",
              text: "Any Gem",
            },
            {
              id: "gem.activegem",
              text: "Skill Gem",
            },
            {
              id: "gem.supportgem",
              text: "Support Gem",
            },
            {
              id: "gem.metagem",
              text: "Meta Gem",
            },
            {
              id: "jewel",
              text: "Any Jewel",
            },
            {
              id: "flask",
              text: "Any Flask",
            },
            {
              id: "flask.life",
              text: "Life Flask",
            },
            {
              id: "flask.mana",
              text: "Mana Flask",
            },
            {
              id: "map",
              text: "Any Endgame Item",
            },
            {
              id: "map.waystone",
              text: "Waystone",
            },
            {
              id: "map.fragment",
              text: "Map Fragment",
            },
            {
              id: "map.logbook",
              text: "Logbook",
            },
            {
              id: "map.breachstone",
              text: "Breachstone",
            },
            {
              id: "map.barya",
              text: "Barya",
            },
            {
              id: "map.bosskey",
              text: "Pinnacle Key",
            },
            {
              id: "map.ultimatum",
              text: "Ultimatum Key",
            },
            {
              id: "map.tablet",
              text: "Tablet",
            },
            {
              id: "card",
              text: "Divination Card",
            },
            {
              id: "sanctum.relic",
              text: "Relic",
            },
            {
              id: "currency",
              text: "Any Currency",
            },
            {
              id: "currency.omen",
              text: "Omen",
            },
            {
              id: "currency.socketable",
              text: "Any Socketable",
            },
            {
              id: "currency.rune",
              text: "Rune",
            },
            {
              id: "currency.soulcore",
              text: "Soul Core",
            },
          ],
        },
      },
      {
        id: "rarity",
        text: "Item Rarity",
        fullSpan: true,
        option: {
          options: [
            {
              id: null,
              text: "Any",
            },
            {
              id: "normal",
              text: "Normal",
            },
            {
              id: "magic",
              text: "Magic",
            },
            {
              id: "rare",
              text: "Rare",
            },
            {
              id: "unique",
              text: "Unique",
            },
            {
              id: "uniquefoil",
              text: "Unique (Foil)",
            },
            {
              id: "nonunique",
              text: "Any Non-Unique",
            },
          ],
        },
      },
      {
        id: "ilvl",
        text: "Item Level",
        minMax: true,
      },
      {
        id: "quality",
        text: "Item Quality",
        minMax: true,
      },
    ],
  },
  {
    id: "equipment_filters",
    title: "Equipment Filters",
    hidden: true,
    filters: [
      {
        id: "damage",
        text: "Damage",
        minMax: true,
      },
      {
        id: "aps",
        text: "Attacks per Second",
        minMax: true,
      },
      {
        id: "crit",
        text: "Critical Chance",
        minMax: true,
      },
      {
        id: "dps",
        text: "Damage per Second",
        minMax: true,
      },
      {
        id: "pdps",
        text: "Physical DPS",
        minMax: true,
      },
      {
        id: "edps",
        text: "Elemental DPS",
        minMax: true,
      },
      {
        id: "ar",
        text: "Armour",
        tip: "Includes base value, local modifiers, and maximum quality",
        minMax: true,
      },
      {
        id: "ev",
        text: "Evasion",
        tip: "Includes base value, local modifiers, and maximum quality",
        minMax: true,
      },
      {
        id: "es",
        text: "Energy Shield",
        tip: "Includes base value, local modifiers, and maximum quality",
        minMax: true,
      },
      {
        id: "block",
        text: "Block",
        tip: "Includes base value and local modifiers",
        minMax: true,
      },
      {
        id: "spirit",
        text: "Spirit",
        tip: "Includes base value, local modifiers, and maximum quality",
        minMax: true,
      },
      {
        id: "rune_sockets",
        text: "Rune Sockets",
        minMax: true,
      },
    ],
  },
  {
    id: "req_filters",
    title: "Requirements",
    hidden: true,
    filters: [
      {
        id: "lvl",
        text: "Level",
        minMax: true,
      },
      {
        id: "str",
        text: "Strength",
        minMax: true,
      },
      {
        id: "dex",
        text: "Dexterity",
        minMax: true,
      },
      {
        id: "int",
        text: "Intelligence",
        minMax: true,
      },
    ],
  },
  {
    id: "map_filters",
    title: "Waystone Filters",
    hidden: true,
    filters: [
      {
        id: "map_tier",
        text: "Waystone Tier",
        minMax: true,
      },
      {
        id: "map_bonus",
        text: "Waystone Drop Chance",
        minMax: true,
      },
    ],
  },
  {
    id: "misc_filters",
    title: "Miscellaneous",
    hidden: true,
    filters: [
      {
        id: "gem_level",
        text: "Gem Level",
        minMax: true,
      },
      {
        id: "gem_sockets",
        text: "Gem Sockets",
        minMax: true,
      },
      {
        id: "area_level",
        text: "Area Level",
        minMax: true,
      },
      {
        id: "stack_size",
        text: "Stack Size",
        minMax: true,
      },
      {
        id: "identified",
        text: "Identified",
        option: {
          options: [
            {
              id: null,
              text: "Any",
            },
            {
              id: "true",
              text: "Yes",
            },
            {
              id: "false",
              text: "No",
            },
          ],
        },
      },
      {
        id: "corrupted",
        text: "Corrupted",
        option: {
          options: [
            {
              id: null,
              text: "Any",
            },
            {
              id: "true",
              text: "Yes",
            },
            {
              id: "false",
              text: "No",
            },
          ],
        },
      },
      {
        id: "mirrored",
        text: "Mirrored",
        option: {
          options: [
            {
              id: null,
              text: "Any",
            },
            {
              id: "true",
              text: "Yes",
            },
            {
              id: "false",
              text: "No",
            },
          ],
        },
      },
      {
        id: "alternate_art",
        text: "Alternate Art",
        option: {
          options: [
            {
              id: null,
              text: "Any",
            },
            {
              id: "true",
              text: "Yes",
            },
            {
              id: "false",
              text: "No",
            },
          ],
        },
      },
      {
        id: "sanctum_gold",
        text: "Barya Sacred Water",
        minMax: true,
      },
      {
        id: "unidentified_tier",
        text: "Unidentified Tier",
        minMax: true,
      },
    ],
  },
  {
    id: "trade_filters",
    title: "Trade Filters",
    hidden: true,
    filters: [
      {
        id: "account",
        text: "Seller Account",
        fullSpan: true,
        input: {
          placeholder: "Enter account name...",
        },
      },
      {
        id: "collapse",
        text: "Collapse Listings by Account",
        fullSpan: true,
        option: {
          options: [
            {
              id: null,
              text: "No",
            },
            {
              id: "true",
              text: "Yes",
            },
          ],
        },
      },
      {
        id: "indexed",
        text: "Listed",
        fullSpan: true,
        option: {
          options: [
            {
              id: null,
              text: "Any Time",
            },
            {
              id: "1hour",
              text: "Up to an Hour Ago",
            },
            {
              id: "3hours",
              text: "Up to 3 Hours Ago",
            },
            {
              id: "12hours",
              text: "Up to 12 Hours Ago",
            },
            {
              id: "1day",
              text: "Up to a Day Ago",
            },
            {
              id: "3days",
              text: "Up to 3 Days Ago",
            },
            {
              id: "1week",
              text: "Up to a Week Ago",
            },
            {
              id: "2weeks",
              text: "Up to 2 Weeks Ago",
            },
            {
              id: "1month",
              text: "Up to 1 Month Ago",
            },
            {
              id: "2months",
              text: "Up to 2 Months Ago",
            },
          ],
        },
      },
      {
        id: "sale_type",
        text: "Sale Type",
        fullSpan: true,
        option: {
          options: [
            {
              id: "any",
              text: "Any",
            },
            {
              id: null,
              text: "Buyout or Fixed Price",
            },
            {
              id: "priced_with_info",
              text: "Price with Note",
            },
            {
              id: "unpriced",
              text: "No Listed Price",
            },
          ],
        },
      },
      {
        id: "price",
        text: "Buyout Price",
        fullSpan: true,
        option: {
          options: [
            {
              id: null,
              text: "Exalted Orb Equivalent",
            },
            {
              id: "exalted_divine",
              text: "Exalted or Divine Orbs",
            },
            {
              id: "aug",
              text: "Orb of Augmentation",
            },
            {
              id: "transmute",
              text: "Orb of Transmutation",
            },
            {
              id: "exalted",
              text: "Exalted Orb",
            },
            {
              id: "regal",
              text: "Regal Orb",
            },
            {
              id: "chaos",
              text: "Chaos Orb",
            },
            {
              id: "vaal",
              text: "Vaal Orb",
            },
            {
              id: "alch",
              text: "Orb of Alchemy",
            },
            {
              id: "divine",
              text: "Divine Orb",
            },
            {
              id: "annul",
              text: "Orb of Annulment",
            },
            {
              id: "mirror",
              text: "Mirror of Kalandra",
            },
          ],
        },
        minMax: true,
      },
    ],
  },
];
