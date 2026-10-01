import InvalidIdException from './invalidIdException.js';
const idNumberControl = (req, res, next) => {
  const id = Number.parseInt(req.params.id);
  if (Number.isNaN(id)) {
    throw new InvalidIdException();
  }
  next();
};
export default idNumberControl;
