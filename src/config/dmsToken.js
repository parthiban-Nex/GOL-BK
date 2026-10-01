import UserDao
from '../modules/user/dao.js';

const checkCatalogueToken =
async (
req,
res,
next
)=>{

try{

const token =
req.headers.token;

if(!token){

return res
.status(401)
.json({
success:false,
message:
"Token missing"
});

}

const validToken =
await UserDao
.verifyDmsToken(
token
);

if(!validToken){

return res
.status(401)
.json({
success:false,
message:
"Invalid or expired token"
});

}
req.user = {
outlet_code:
validToken.outlet_code
};

req.dmsUser =
validToken;

next();

}catch(err){

console.log(
"Catalogue token error",
err
);

return res
.status(500)
.json({
success:false,
message:
"Token validation failed"
});

}

};

export default {
checkCatalogueToken
};