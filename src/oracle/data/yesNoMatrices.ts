/**
 * PUM granular Yes/No oracle matrices (d100 × likelihood → answer index).
 * Source: Plot Unfolding Machine v9.0 granular oracles sheet.
 * Answer strings live in lang/en.json under DMEMU.Oracle.Answer.*
 */

export type YesNoPerspective = "deterministic" | "subjective" | "conversation";

export type Likelihood =
   | "unlikely"
   | "neutral"
   | "likely"
   | "surely"
   | "certain"
   | "hardly"
   | "noWay";

/** Inclusive d100 band mapped to an answer i18n key suffix. */
export type YesNoBand = { min: number; max: number; answer: string };

export type LikelihoodTable = Record<Likelihood, YesNoBand[]>;

export interface YesNoPerspectiveDef {
   /** i18n key under DMEMU.Oracle.Perspective.* */
   id: YesNoPerspective;
   likelihoods: LikelihoodTable;
}

function bands(ranges: [number, number][], answers: string[]): YesNoBand[] {
   if (ranges.length !== answers.length) {
      throw new Error(`Band/answer length mismatch: ${ranges.length} vs ${answers.length}`);
   }
   return ranges.map(([min, max], i) => ({ min, max, answer: answers[i] }));
}

const DET = [
   "deterministic.strongNo",
   "deterministic.no",
   "deterministic.weakNo",
   "deterministic.weakYes",
   "deterministic.yes",
   "deterministic.strongYes",
] as const;

const SUBJ = [
   "subjective.noDefinitelyNot",
   "subjective.noApparentlyNot",
   "subjective.noNotYet",
   "subjective.noBut",
   "subjective.dontKnow",
   "subjective.itDepends",
   "subjective.yesBut",
   "subjective.yesSometimes",
   "subjective.yesApparently",
   "subjective.yesAbsolutely",
] as const;

const CONV = [
   "conversation.noAnd",
   "conversation.noDefinitelyNot",
   "conversation.noDangerous",
   "conversation.noTooLate",
   "conversation.noIThinkNot",
   "conversation.noUnless",
   "conversation.noBut",
   "conversation.iDontKnow",
   "conversation.itsComplicated",
   "conversation.yesBut",
   "conversation.yesForAPrice",
   "conversation.yesPrettySure",
   "conversation.yesHurryUp",
   "conversation.yesBeCareful",
   "conversation.yesOfCourse",
   "conversation.yesAnd",
] as const;

export const LIKELIHOODS: Likelihood[] = [
   "noWay",
   "hardly",
   "unlikely",
   "neutral",
   "likely",
   "surely",
   "certain",
];

export const PERSPECTIVES: YesNoPerspective[] = ["deterministic", "subjective", "conversation"];

export const YES_NO_MATRICES: Record<YesNoPerspective, LikelihoodTable> = {
   deterministic: {
      unlikely: bands(
         [
            [1, 12],
            [13, 52],
            [53, 65],
            [66, 77],
            [78, 93],
            [94, 100],
         ],
         [...DET]
      ),
      neutral: bands(
         [
            [1, 8],
            [9, 40],
            [41, 50],
            [51, 60],
            [61, 92],
            [93, 100],
         ],
         [...DET]
      ),
      likely: bands(
         [
            [1, 7],
            [8, 23],
            [24, 35],
            [36, 48],
            [49, 88],
            [89, 100],
         ],
         [...DET]
      ),
      surely: bands(
         [
            [1, 4],
            [5, 10],
            [11, 20],
            [21, 30],
            [31, 85],
            [86, 100],
         ],
         [...DET]
      ),
      certain: bands(
         [
            [1, 2],
            [3, 5],
            [6, 12],
            [13, 24],
            [25, 82],
            [83, 100],
         ],
         [...DET]
      ),
      hardly: bands(
         [
            [1, 15],
            [16, 70],
            [71, 80],
            [81, 90],
            [91, 96],
            [97, 100],
         ],
         [...DET]
      ),
      noWay: bands(
         [
            [1, 18],
            [19, 76],
            [77, 88],
            [89, 95],
            [96, 98],
            [99, 100],
         ],
         [...DET]
      ),
   },
   subjective: {
      unlikely: bands(
         [
            [1, 20],
            [21, 36],
            [37, 49],
            [50, 59],
            [60, 64],
            [65, 69],
            [70, 75],
            [76, 82],
            [83, 90],
            [91, 100],
         ],
         [...SUBJ]
      ),
      neutral: bands(
         [
            [1, 15],
            [16, 27],
            [28, 37],
            [38, 45],
            [46, 50],
            [51, 55],
            [56, 63],
            [64, 73],
            [74, 85],
            [86, 100],
         ],
         [...SUBJ]
      ),
      likely: bands(
         [
            [1, 10],
            [11, 18],
            [19, 25],
            [26, 31],
            [32, 36],
            [37, 41],
            [42, 51],
            [52, 64],
            [65, 80],
            [81, 100],
         ],
         [...SUBJ]
      ),
      surely: bands(
         [
            [1, 6],
            [7, 12],
            [13, 18],
            [19, 24],
            [25, 29],
            [30, 34],
            [35, 44],
            [45, 56],
            [57, 76],
            [77, 100],
         ],
         [...SUBJ]
      ),
      certain: bands(
         [
            [1, 2],
            [3, 5],
            [6, 9],
            [10, 15],
            [16, 20],
            [21, 25],
            [26, 37],
            [38, 51],
            [52, 74],
            [75, 100],
         ],
         [...SUBJ]
      ),
      hardly: bands(
         [
            [1, 24],
            [25, 44],
            [45, 56],
            [57, 66],
            [67, 71],
            [72, 76],
            [77, 82],
            [83, 88],
            [89, 94],
            [95, 100],
         ],
         [...SUBJ]
      ),
      noWay: bands(
         [
            [1, 26],
            [27, 49],
            [50, 63],
            [64, 75],
            [76, 80],
            [81, 85],
            [86, 91],
            [92, 95],
            [96, 98],
            [99, 100],
         ],
         [...SUBJ]
      ),
   },
   conversation: {
      unlikely: bands(
         [
            [1, 8],
            [9, 16],
            [17, 24],
            [25, 32],
            [33, 40],
            [41, 48],
            [49, 56],
            [57, 64],
            [65, 72],
            [73, 76],
            [77, 80],
            [81, 84],
            [85, 88],
            [89, 92],
            [93, 96],
            [97, 100],
         ],
         [...CONV]
      ),
      neutral: bands(
         [
            [1, 6],
            [7, 12],
            [13, 18],
            [19, 24],
            [25, 30],
            [31, 36],
            [37, 42],
            [43, 50],
            [51, 58],
            [59, 64],
            [65, 70],
            [71, 76],
            [77, 82],
            [83, 88],
            [89, 94],
            [95, 100],
         ],
         [...CONV]
      ),
      likely: bands(
         [
            [1, 4],
            [5, 8],
            [9, 12],
            [13, 16],
            [17, 20],
            [21, 24],
            [25, 28],
            [29, 36],
            [37, 44],
            [45, 52],
            [53, 60],
            [61, 68],
            [69, 76],
            [77, 84],
            [85, 92],
            [93, 100],
         ],
         [...CONV]
      ),
      surely: bands(
         [
            [1, 3],
            [4, 6],
            [7, 9],
            [10, 12],
            [13, 15],
            [16, 18],
            [19, 21],
            [22, 29],
            [30, 37],
            [38, 46],
            [47, 55],
            [56, 64],
            [65, 73],
            [74, 82],
            [83, 91],
            [92, 100],
         ],
         [...CONV]
      ),
      certain: bands(
         [
            [1, 2],
            [3, 4],
            [5, 6],
            [7, 8],
            [9, 10],
            [11, 12],
            [13, 14],
            [15, 22],
            [23, 30],
            [31, 40],
            [41, 50],
            [51, 60],
            [61, 70],
            [71, 80],
            [81, 90],
            [91, 100],
         ],
         [...CONV]
      ),
      hardly: bands(
         [
            [1, 9],
            [10, 18],
            [19, 27],
            [28, 36],
            [37, 45],
            [46, 54],
            [55, 63],
            [64, 71],
            [72, 79],
            [80, 82],
            [83, 85],
            [86, 88],
            [89, 91],
            [92, 94],
            [95, 97],
            [98, 100],
         ],
         [...CONV]
      ),
      noWay: bands(
         [
            [1, 10],
            [11, 20],
            [21, 30],
            [31, 40],
            [41, 50],
            [51, 60],
            [61, 70],
            [71, 78],
            [79, 86],
            [87, 88],
            [89, 90],
            [91, 92],
            [93, 94],
            [95, 96],
            [97, 98],
            [99, 100],
         ],
         [...CONV]
      ),
   },
};

export function resolveYesNoBand(
   perspective: YesNoPerspective,
   likelihood: Likelihood,
   roll: number
): YesNoBand {
   const table = YES_NO_MATRICES[perspective]?.[likelihood];
   if (!table) {
      throw new Error(`Unknown Yes/No matrix: ${perspective}/${likelihood}`);
   }
   const band = table.find((b) => roll >= b.min && roll <= b.max);
   if (!band) {
      throw new Error(`No band for roll ${roll} in ${perspective}/${likelihood}`);
   }
   return band;
}
