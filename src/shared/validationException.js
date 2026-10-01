function ValidationException(errors) {
  this.status = 200;
  this.requestSuccessful = false;
  this.message = 'Data not Saved';
  this.errors = errors;
}
export default ValidationException;
