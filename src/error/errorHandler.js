const errorHandler = (err, req, res, next) => {
  const { status, message, errors, requestSuccessful } = err;
  // console.log("eeee",errors)
  // console.log('err',err);
  let validationErrors;

  if (err.name == 'SequelizeForeignKeyConstraintError') {
    validationErrors = {};
    validationErrors[err.fields[0]] = err.fields[0] + ' not found';
    return res.status(400).json({
      requestSuccessful: false,
      message: 'Data not Saved',
      validationErrors,
    });
  } else if (err.name == 'SequelizeUniqueConstraintError') {
    if (errors) {
      validationErrors = {};
      errors.forEach((error) => {
        validationErrors[error.path] = error.message;
      });
      return res
        .status(400)
        .json({
          requestSuccessful: false,
          message: 'Data not Saved',
          validationErrors,
        });
    }
  } else {
    let validationErrors = '';
    if (errors) {
      const errorMessages = errors.map((error) => error.msg);
      validationErrors = errorMessages.join(',');
    }
    res.status(status || 500).send({
      requestSuccessful: requestSuccessful,
      message: message,
      validationErrors: validationErrors,
    });
  }
};
export default errorHandler;
