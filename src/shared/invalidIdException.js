function InvalidIdException() {
  this.status = 400;
  (this.requestSuccessful = false), (this.message = 'Invalid ID');
}
export default InvalidIdException;
