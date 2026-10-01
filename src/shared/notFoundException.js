function NotFoundException() {
  this.status = 400;
  (this.requestSuccessful = false),
    (this.message = 'Data not found with this id');
}
export default NotFoundException;
