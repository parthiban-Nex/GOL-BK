import db from '../modules/index.js';
import { Op } from 'sequelize';
// import { StatusTrue } from '../config/moduleName.js';
import moduleName from '../config/moduleName.js';

const User = db.users;
const RoleAccess = db.roleaccesses;
const UserRoleMap = db.userrolemaps;
const Role = db.roles;

const roleAuth = function (moduelId, subModuelId) {
  return async function test(req, res, next) {
    try {
      const id = req.user.id;
      const user = await UserRoleMap.findOne({ where: { id: id } });
      if (user) {
        const role = await Role.findOne({ where: { id: user.roleId } });
        if (role.status) {
          RoleAccess.findOne({
            where: {
              [Op.and]: [
                { roleId: user.roleId },
                { roleModuleId: moduelId },
                { roleSubModuleId: subModuelId },
                { status: moduleName.StatusTrue },
              ],
            },
          }).then((data) => {
            if (!data) {
              return res.status(404).send({ message: 'Api not authorized' });
            }
            req.roleAccess = data;
            next();
          });
        }
      } else {
        return res.status(404).send({ message: 'Api not authorized' });
        next();
      }
    } catch (err) {
      next(err);
    }
  };
};
export default roleAuth;
