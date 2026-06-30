const getPagination = (query, defaults = {}) => {
  const defaultPage = defaults.page || 1;
  const defaultLimit = defaults.limit || 10;
  const maxLimit = defaults.maxLimit || 50;

  const page = Math.max(Number(query.page) || defaultPage, 1);
  const limit = Math.min(Math.max(Number(query.limit) || defaultLimit, 1), maxLimit);
  const offset = (page - 1) * limit;

  return {
    page,
    limit,
    offset,
  };
};

const getPaginationMeta = ({ page, limit, total }) => ({
  page,
  limit,
  total,
  totalPages: Math.ceil(total / limit),
});

module.exports = {
  getPagination,
  getPaginationMeta,
};
