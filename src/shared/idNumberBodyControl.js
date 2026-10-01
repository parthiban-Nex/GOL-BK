import InvalidIdException from './invalidIdException.js';
const idNumberBodyControl = (req, res, next) => {
  const id = Number.parseInt(req.body.id);
  if (Number.isNaN(id)) {
    throw new InvalidIdException();
  }
  next();
};
export default idNumberBodyControl;
