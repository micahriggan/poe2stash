import { describe, it, expect } from "vitest";
import { formatModText, modValues, statId, parseMod } from "./mods";
import { ItemMod } from "./types";

const mod = (overrides: Partial<ItemMod> = {}): ItemMod => ({
  description: "+232 to [Evasion] Rating",
  domain: "explicit",
  hash: "stat.explicit.stat_53045048",
  mods: [
    { name: "Adroit", tier: "P3", level: 65, magnitudes: [{ min: "208", max: "234" }] },
  ],
  ...overrides,
});

describe("formatModText", () => {
  it("keeps the second half of a piped alternative", () => {
    expect(formatModText("Adds 14 to 22 [Cold] damage to [Attack|Attacks]")).toBe(
      "Adds 14 to 22 Cold damage to Attacks",
    );
  });

  it("unwraps plain brackets", () => {
    expect(formatModText("+232 to [Evasion] Rating")).toBe("+232 to Evasion Rating");
  });

  it("handles several alternatives in one description", () => {
    expect(
      formatModText("24% increased [CriticalDamageBonus|Critical Spell Damage Bonus]"),
    ).toBe("24% increased Critical Spell Damage Bonus");
  });

  it("leaves unmarked text alone", () => {
    expect(formatModText("+20 to maximum Mana")).toBe("+20 to maximum Mana");
  });
});

describe("modValues", () => {
  it("reads both values off a range mod, in order", () => {
    expect(modValues("Adds 14 to 22 [Cold] damage")).toEqual([14, 22]);
  });

  it("reads signed and decimal values", () => {
    expect(modValues("-5 to maximum Life")).toEqual([-5]);
    expect(modValues("1.5% of Damage leeched")).toEqual([1.5]);
  });

  it("ignores numbers hidden inside markup that is dropped", () => {
    // The left half of an alternative never reaches the player, so its digits must not
    // be mistaken for a roll.
    expect(modValues("[Resistance7|Fire Resistance] +45%")).toEqual([45]);
  });

  it("returns nothing for a mod without values", () => {
    expect(modValues("Cannot be Frozen")).toEqual([]);
  });
});

describe("statId", () => {
  it("strips the stat prefix the search API does not use", () => {
    expect(statId("stat.explicit.stat_53045048")).toBe("explicit.stat_53045048");
  });

  it("leaves an already-stripped id untouched", () => {
    expect(statId("explicit.stat_53045048")).toBe("explicit.stat_53045048");
  });
});

describe("parseMod", () => {
  it("pulls the id, values, and tier straight off the mod", () => {
    expect(parseMod(mod())).toEqual({
      hash: "explicit.stat_53045048",
      text: "+232 to Evasion Rating",
      value1: 232,
      value2: undefined,
      tier: "P3",
      tierNum: 3,
      level: 65,
    });
  });

  it("keeps both values of a range mod", () => {
    const parsed = parseMod(
      mod({
        description: "Adds 14 to 22 [Cold] damage to [Attack|Attacks]",
        mods: [
          {
            name: "Glaciated",
            tier: "P3",
            level: 60,
            magnitudes: [
              { min: "14", max: "15" },
              { min: "22", max: "24" },
            ],
          },
        ],
      }),
    );

    expect(parsed.value1).toBe(14);
    expect(parsed.value2).toBe(22);
  });

  it("reads suffix tiers as well as prefix tiers", () => {
    expect(parseMod(mod({ mods: [{ name: "of Ferocity", tier: "S0", level: 69, magnitudes: [] }] })))
      .toMatchObject({ tier: "S0", tierNum: 0 });
  });

  it("leaves the tier undefined when the mod carries no affix data", () => {
    // Not 0 — tier 0 is a real tier, so 0 would rank an unknown mod as the best roll.
    const parsed = parseMod(mod({ mods: [] }));

    expect(parsed.tierNum).toBeUndefined();
    expect(parsed.tier).toBeUndefined();
    expect(parsed.level).toBe(0);
  });

  it("does not throw on an unrecognised mod", () => {
    // The old parser threw when a mod was missing from the stat table.
    expect(() =>
      parseMod(mod({ description: "Some brand new mod", hash: "stat.explicit.stat_999" })),
    ).not.toThrow();
  });
});
