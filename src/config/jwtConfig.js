const jwtConfig = {
  secret: 'secret',
  expiresIn: 60*60*2, //2h
  notBefore: 0,
  algorithm: 'HS384',
};
export default jwtConfig;
