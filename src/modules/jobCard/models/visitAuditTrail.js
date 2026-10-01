export default function VisitAuditTrail(sequelize, DataTypes) {
    const VisitAuditTrail = sequelize.define(
        'vrm_trans_visit_audit_trail',
        {
            VISIT_ID: {
                type: DataTypes.INTEGER,
                primaryKey: true,
                allowNull: false,
            },
            AUDIT_TRAIL: {
                type: DataTypes.STRING(7000),
                allowNull: false,
            }
        }
    );

    return VisitAuditTrail;
}