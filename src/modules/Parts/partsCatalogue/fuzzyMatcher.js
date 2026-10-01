/**
 * Fuzzy matching module for matching Vahan vehicle data to Master API values.
 * Uses token overlap + Levenshtein distance scoring.
 */

const THRESHOLD = 0.4;

/**
 * Compute Levenshtein distance between two strings.
 */
function levenshteinDistance(a, b) {
  const matrix = [];

  for (let i = 0; i <= a.length; i++) {
    matrix[i] = [i];
  }

  for (let j = 0; j <= b.length; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;

      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1,      // deletion
        matrix[i][j - 1] + 1,      // insertion
        matrix[i - 1][j - 1] + cost // substitution
      );
    }
  }

  return matrix[a.length][b.length];
}

/**
 * Normalize a string for comparison.
 */
function normalize(str) {
  return String(str || '')
    .toUpperCase()
    .replace(/[^A-Z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Tokenize a normalized string.
 */
function tokenize(str) {
  return normalize(str)
    .split(' ')
    .filter(token => token.length > 0);
}

/**
 * Compute token overlap score.
 */
function tokenOverlapScore(source, candidate) {
  const sourceTokens = tokenize(source);
  const candidateTokens = tokenize(candidate);

  if (!candidateTokens.length) {
    return 0;
  }

  let matches = 0;

  for (const ct of candidateTokens) {
    if (
      sourceTokens.some(
        st =>
          st === ct ||
          st.includes(ct) ||
          ct.includes(st)
      )
    ) {
      matches++;
    }
  }

  return matches / candidateTokens.length;
}

/**
 * Compute Levenshtein similarity ratio (0-1).
 */
function levenshteinRatio(source, candidate) {
  const a = normalize(source);
  const b = normalize(candidate);

  const maxLen = Math.max(a.length, b.length);

  if (maxLen === 0) {
    return 1;
  }

  return 1 - levenshteinDistance(a, b) / maxLen;
}

/**
 * Combined fuzzy score.
 * 60% token overlap + 40% Levenshtein.
 */
function fuzzyScore(source, candidate) {
  const tokenScore = tokenOverlapScore(source, candidate);
  const levScore = levenshteinRatio(source, candidate);

  return (0.6 * tokenScore) + (0.4 * levScore);
}

/**
 * Find best match from candidate list.
 */
function findBestMatch(source, candidates) {
  if (!source || !Array.isArray(candidates) || !candidates.length) {
    return {
      match: null,
      score: 0
    };
  }

  let bestMatch = null;
  let bestScore = 0;

  for (const candidate of candidates) {
      const tokenScore = tokenOverlapScore(source, candidate);
  const levScore = levenshteinRatio(source, candidate);

    const score = fuzzyScore(source, String(candidate));
      if (candidate.includes("AMBITION")) {
    console.log({
      candidate,
      tokenScore,
      levScore,
      score
    });
  }
      console.log(
    "SOURCE:", source,
    "| CANDIDATE:", candidate,
    "| SCORE:", score
  );
  
    if (score > bestScore) {
      bestScore = score;
      bestMatch = String(candidate);
    }
  }
console.log("BEST MATCH RESULT:", {
  source,
  bestMatch,
  bestScore
});
  if (bestScore < THRESHOLD) {
    return {
      match: null,
      score: bestScore
    };
  }

  return {
    match: bestMatch,
    score: bestScore
  };
}

/**
 * Match Vahan vehicle data to Master API candidates.
 */
function fuzzyMatchVehicle(vahanData, candidates) {
  const result = {
    make: null,
    model: null,
    variant: null,
    fuelType: null,
    year: null
  };

  // Make
  if (
    vahanData.manufacturer &&
    candidates.makes &&
    candidates.makes.length
  ) {
    const { match } = findBestMatch(
      vahanData.manufacturer,
      candidates.makes
    );

    result.make = match;
  }

  // Model
  if (
    vahanData.manufacturer_model &&
    candidates.models &&
    candidates.models.length
  ) {
    const { match } = findBestMatch(
      vahanData.manufacturer_model,
      candidates.models
    );

    result.model = match;
  }

  // Variant
  if (
    vahanData.manufacturer_model &&
    candidates.variants &&
    candidates.variants.length
  ) {
    const { match } = findBestMatch(
      vahanData.manufacturer_model,
      candidates.variants
    );

    result.variant = match;
  }

  // Fuel Type
  if (
    vahanData.fuel_type &&
    candidates.fuelTypes &&
    candidates.fuelTypes.length
  ) {
    const normalizedFuel = normalize(vahanData.fuel_type);

    const exactMatch = candidates.fuelTypes.find(
      ft => normalize(ft) === normalizedFuel
    );

    if (exactMatch) {
      result.fuelType = exactMatch;
    } else {
      const { match } = findBestMatch(
        vahanData.fuel_type,
        candidates.fuelTypes
      );

      result.fuelType = match;
    }
  }

  // Year
  if (
    vahanData.y_manufacturing &&
    candidates.years &&
    candidates.years.length
  ) {
    const yearStr = String(vahanData.y_manufacturing).trim();

    const exactYear = candidates.years.find(
      y => String(y).trim() === yearStr
    );

    if (exactYear) {
      result.year = String(exactYear);
    }
  }

  return result;
}

export {
  fuzzyScore,
  findBestMatch,
  fuzzyMatchVehicle
};