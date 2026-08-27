const Explanation = require('../models/Explanation');
const explanationsData = require('../data/explanationsData.json');
const { isDbConnected } = require('../config/db');

class ExplanationService {
  /**
   * Helper to normalize term string into a comparable slug
   */
  _toSlug(str) {
    if (!str) return '';
    return str
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }

  /**
   * Fetch all educational explanations
   */
  async getAllExplanations() {
    if (isDbConnected()) {
      try {
        const dbList = await Explanation.find({}).lean();
        if (dbList && dbList.length > 0) {
          return dbList.map(({ _id, __v, ...item }) => item);
        }
      } catch (err) {
        console.warn(`[ExplanationService] MongoDB query failed (${err.message}). Using local JSON dataset.`);
      }
    }
    return explanationsData;
  }

  /**
   * Fetch explanation for a specific term (by exact term name or slug)
   */
  async getExplanationByTerm(termQuery) {
    if (!termQuery) return null;

    const querySlug = this._toSlug(termQuery);

    if (isDbConnected()) {
      try {
        const dbResult = await Explanation.findOne({
          $or: [
            { slug: querySlug },
            { term: { $regex: new RegExp(`^${termQuery}$`, 'i') } }
          ]
        }).lean();

        if (dbResult) {
          const { _id, __v, ...cleanResult } = dbResult;
          return cleanResult;
        }
      } catch (err) {
        console.warn(`[ExplanationService] MongoDB search failed (${err.message}). Searching local JSON dataset.`);
      }
    }

    // Search local JSON dataset
    const found = explanationsData.find(
      (item) => item.slug === querySlug || this._toSlug(item.term) === querySlug || item.term.toLowerCase() === termQuery.toLowerCase()
    );

    return found || null;
  }

  /**
   * Seed explanations into MongoDB if connected and empty
   */
  async seedExplanationsIfEmpty() {
    if (!isDbConnected()) return;
    try {
      const count = await Explanation.countDocuments();
      if (count === 0) {
        await Explanation.insertMany(explanationsData);
        console.log('[ExplanationService] Seeded financial term explanations into MongoDB.');
      }
    } catch (err) {
      console.warn(`[ExplanationService] Could not seed explanations: ${err.message}`);
    }
  }
}

module.exports = new ExplanationService();
