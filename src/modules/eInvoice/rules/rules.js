
import { check, validationResult } from 'express-validator';


export const validateInvoice = {
    create: [
        // Transaction Details
        check("TranDtls.TaxSch")
            .notEmpty().withMessage("TaxSch is required")
            .isString().withMessage("TaxSch must be a string")
            .isLength({ min: 3, max: 10 }).withMessage("TaxSch must be between 3 and 10 characters")
            .isIn(["GST"]).withMessage("TaxSch must be 'GST'")
            .matches(/^(GST)$/).withMessage("TaxSch must match pattern 'GST'"),
        check("TranDtls.SupTyp")
            .notEmpty().withMessage("SupTyp is required")
            .isString().withMessage("SupTyp must be a string")
            .isLength({ min: 3, max: 10 }).withMessage("SupTyp must be between 3 and 10 characters")
            .isIn(["B2B", "SEZWP", "SEZWOP", "EXPWP", "EXPWOP", "DEXP"]).withMessage("SupTyp must be one of B2B, SEZWP, SEZWOP, EXPWP, EXPWOP, DEXP")
            .matches(/^(B2B|SEZWP|SEZWOP|EXPWP|EXPWOP|DEXP)$/i).withMessage("SupTyp must match the allowed pattern"),
        check("TranDtls.RegRev")
            .notEmpty().withMessage("RegRev is required") //optional but for better validation i included it
            .isString().withMessage("RegRev must be a string")
            .isLength({ min: 1, max: 1 }).withMessage("RegRev must be between 3 and 10 characters")
            .isIn(["Y", "N"]).withMessage("RegRev must be 'Y' or 'N'")
            .matches(/^(Y|N)$/).withMessage("RegRev must match pattern 'Y' or 'N'"),
        // check("TranDtls.EcmGstin")
        //     .optional()
        //     .custom((value) => value === null || typeof value === "string")
        //     .withMessage("EcmGstin should be null or a valid string")
        //     .isLength({ min: 15, max: 15 })
        //     .withMessage("EcmGstin must be exactly 15 characters long")
        //     .matches(/^([0-9]{2}[0-9A-Z]{13})$/)
        //     .withMessage("EcmGstin must match the required GSTIN format (2 digits followed by 13 alphanumeric characters)"),
        // check("TranDtls.IgstOnIntra")
        //     .optional()
        //     .isString()
        //     .withMessage("IgstOnIntra must be a string")
        //     .isLength({ min: 1, max: 1 })
        //     .withMessage("IgstOnIntra must be exactly 1 character long")
        //     .matches(/^(Y|N)$/)
        //     .withMessage("IgstOnIntra must be either 'Y' or 'N'"),

        // Document Details
        check("DocDtls.Typ")
            .notEmpty().withMessage("DocType is required")
            .isString().withMessage("DocType must be a string")
            .isLength({ min: 3, max: 3 }).withMessage("DocType must be between 3 and 3 characters")
            .isIn(["INV", "CRN", "DBN"]).withMessage("DocType must be GST,INV,CRN,DBN")
            .matches(/^(INV|CRN|DBN)$/i).withMessage("DocType must match the allowed pattern"),
        check("DocDtls.No")
            .notEmpty().withMessage("DocDtls.No is required")
            .isString().withMessage("DocDtls.No must be a string")
            .isLength({ min: 10, max: 16 }).withMessage("DocDtls.No must be between 10 and 16 characters")
            .matches(/^([a-zA-Z1-9]{1}[a-zA-Z0-9\/-]{0,15})$/i).withMessage("DocDtls.No must match the allowed pattern"),
        check("DocDtls.Dt")
            .notEmpty().withMessage("DocDtls.Dt is required")
            .isString().withMessage("DocDtls.Dt must be a string")
            .isLength({ min: 10, max: 10 }).withMessage("DocDtls.Dt must be between 10 and 10 characters")
            .matches(/^(0[1-9]|[12][0-9]|3[01])\/(0[1-9]|1[0-2])\/20[1-2][0-9]$/)
            .withMessage("DocDtls.Dt must be in DD/MM/YYYY format with a valid date"),

        // Seller Details
        check("SellerDtls.Gstin")
            .notEmpty().withMessage("Seller GSTIN is required")
            .isString().withMessage("Seller GSTIN must be a string")
            .isLength({ min: 15, max: 15 }).withMessage("Seller GSTIN must be exactly 15 characters long")
            .matches(/^([0-9]{2}[0-9A-Z]{13})$/).withMessage("Seller GSTIN must match the required GSTIN format (2 digits followed by 13 alphanumeric characters)"),
        check("SellerDtls.LglNm")
            .notEmpty().withMessage("Seller LglNm is required")
            .isString().withMessage("Seller LglNm must be a string")
            .isLength({ min: 3, max: 100 }).withMessage("Seller LglNm must be between 3 and 100 characters")
            .matches(/^([^\\"])+$/).withMessage("Seller LglNm must match the allowed pattern"),
        // check("SellerDtls.TrdNm")
        //     .optional()
        //     .isString().withMessage("Seller TrdNm must be a string")
        //     .isLength({ min: 3, max: 100 }).withMessage("Seller TrdNm must be between 3 and 100 characters")
        //     .matches(/^([^\\"])+$/).withMessage("Seller TrdNm must match the allowed pattern"),
        check("SellerDtls.Addr1")
            .notEmpty().withMessage("Seller Addr1 is required")
            .isString().withMessage("Seller Addr1 must be a string")
            .isLength({ min: 1, max: 100 }).withMessage("Seller Addr1 must be between 1 and 100 characters")
            .matches(/^([^\\"])+$/).withMessage("Seller Addr1 must match the allowed pattern"),
        check("SellerDtls.Addr2")
            .optional()
            .isString().withMessage("Seller Addr2 must be a string")
            .isLength({ min: 3, max: 100 }).withMessage("Seller Addr2 must be between 3 and 100 characters")
            .matches(/^([^\\"])+$/).withMessage("Seller Addr2 must match the allowed pattern"),
        check("SellerDtls.Loc")
            .notEmpty().withMessage("Seller Loc is required")
            .isString().withMessage("Seller Loc must be a string")
            .isLength({ min: 3, max: 50 }).withMessage("Seller Loc must be between 3 and 50 characters")
            .matches(/^([^\\"])+$/).withMessage("Seller Loc must match the allowed pattern"),
        check("SellerDtls.Pin")
            .notEmpty().withMessage("Seller Pin is required")
            .isNumeric().withMessage("Seller Pin must be a number")
            .isInt({ min: 100000, max: 999999 }).withMessage("Seller Pin must be a 6-digit number"),
        check("SellerDtls.Stcd")
            .notEmpty().withMessage("Seller Stcd is required")
            .isString().withMessage("Seller Stcd must be a string")
            .isLength({ min: 1, max: 2 }).withMessage("Seller Stcd must be 1 or 2 characters long")
            .matches(/^(?!0+$)[0-9]{1,2}$/).withMessage("Seller Stcd must be a valid state code"),
        check("SellerDtls.Ph")
            .optional()
            .isString().withMessage("Seller Ph must be a string")
            .isLength({ min: 6, max: 12 }).withMessage("Seller Ph must be a  6 to 10-digit number")
            .matches(/^([0-9]{6,12})$/).withMessage("Seller Ph must be a valid 10-digit number"),
        check("SellerDtls.Em")
            .optional()
            .isString().withMessage("Seller Em must be a string")
            .isEmail().withMessage("Seller Em must be a valid email address"),

        // BuyerDtls Details
        check("BuyerDtls.Gstin")
            .notEmpty().withMessage("Buyer GSTIN is required")
            .isString().withMessage("Buyer GSTIN must be a string")
            .isLength({ min: 3, max: 15 }).withMessage("Buyer GSTIN must be exactly 15 characters long")
            .matches(/^(([0-9]{2}[0-9A-Z]{13})|URP)$/).withMessage("Buyer GSTIN must match the required GSTIN format (2 digits followed by 13 alphanumeric characters)"),
        check("BuyerDtls.LglNm")
            .notEmpty().withMessage("Buyer LglNm is required")
            .isString().withMessage("Buyer LglNm must be a string")
            .isLength({ min: 3, max: 100 }).withMessage("Buyer LglNm must be between 3 and 100 characters")
            .matches(/^[^\\"]*$/).withMessage("Buyer LglNm must match the allowed pattern"),
        check("BuyerDtls.TrdNm")
            .optional()
            .isString().withMessage("Buyer TrdNm must be a string")
            .isLength({ min: 3, max: 100 }).withMessage("Buyer TrdNm must be between 3 and 100 characters")
            .matches(/^[^\\"]*$/).withMessage("Buyer TrdNm must match the allowed pattern"),
        check("BuyerDtls.Pos")
            .notEmpty().withMessage("Buyer Pos is required")
            .isString().withMessage("Buyer Pos must be a string")
            .isLength({ min: 1, max: 2 }).withMessage("Buyer Pos must be exactly 2 characters long")
            .matches(/^(?!0+$)[0-9]{1,2}$/).withMessage("Buyer Pos must be a valid state code"),
        check("BuyerDtls.Addr1")
            .notEmpty().withMessage("Buyer Addr1 is required")
            .isString().withMessage("Buyer Addr1 must be a string")
            .isLength({ min: 1, max: 100 }).withMessage("Buyer Addr1 must be between 1 and 100 characters")
            .matches(/^[^\\"]*$/).withMessage("Buyer Addr1 must match the allowed pattern"),
        check("BuyerDtls.Addr2")
            .optional()
            .isString().withMessage("Buyer Addr2 must be a string")
            .isLength({ min: 3, max: 100 }).withMessage("Buyer Addr2 must be between 3 and 100 characters")
            .matches(/^[^\\"]*$/).withMessage("Buyer Addr2 must match the allowed pattern"),
        check("BuyerDtls.Loc")
            .notEmpty().withMessage("Buyer Loc is required")
            .isString().withMessage("Buyer Loc must be a string")
            .isLength({ min: 3, max: 100 }).withMessage("Buyer Loc must be between 3 and 100 characters")
            .matches(/^[^\\"]*$/).withMessage("Buyer Loc must match the allowed pattern"),
        check("BuyerDtls.Pin")
            .optional()
            .isNumeric().withMessage("Buyer Pin must be a number")
            .isInt({ min: 100000, max: 999999 }).withMessage("Buyer Pin must be a 6-digit number"),
        check("BuyerDtls.Stcd")
            .notEmpty().withMessage("Buyer Stcd is required")
            .isString().withMessage("Buyer Stcd must be a string")
            .isLength({ min: 1, max: 2 }).withMessage("Buyer Stcd must be 1 or 2 characters long")
            .matches(/^(?!0+$)[0-9]{1,2}$/).withMessage("Buyer Stcd must be a valid state code"),
        check("BuyerDtls.Ph")
            .optional()
            .isString().withMessage("BuyerDtls Ph must be a string")
            .isLength({ min: 6, max: 12 }).withMessage("BuyerDtls Ph must be a  6 to 10-digit number")
            .matches(/^([0-9]{6,12})$/).withMessage("BuyerDtls Ph must be a valid 10-digit number"),
        check("BuyerDtls.Em")
            .optional()
            .isString().withMessage("BuyerDtls Em must be a string"),
            

        // Dispatch Details
        check("DispDtls.Nm")
            .notEmpty().withMessage("Dispatch Name (Nm) is required")
            .isString().withMessage("Dispatch Name (Nm) must be a string")
            .isLength({ min: 3, max: 100 }).withMessage("Dispatch Name (Nm) must be between 3 and 100 characters")
            .matches(/^([^\\"])+$/).withMessage("Dispatch Name (Nm) must match the allowed pattern"),
        check("DispDtls.Addr1")
            .notEmpty().withMessage("Dispatch Address (Addr1) is required")
            .isString().withMessage("Dispatch Address (Addr1) must be a string")
            .isLength({ min: 1, max: 100 }).withMessage("Dispatch Address (Addr1) must be between 1 and 100 characters")
            .matches(/^([^\\"])+$/).withMessage("Dispatch Address (Addr1) must match the allowed pattern"),
        check("DispDtls.Addr2")
            .optional()
            .isString().withMessage("Dispatch Address (Addr2) must be a string")
            .isLength({ min: 3, max: 100 }).withMessage("Dispatch Address (Addr2) must be between 3 and 100 characters")
            .matches(/^([^\\"])+$/).withMessage("Dispatch Address (Addr2) must match the allowed pattern"),
        check("DispDtls.Loc")
            .notEmpty().withMessage("Dispatch Location (Loc) is required")
            .isString().withMessage("Dispatch Location (Loc) must be a string")
            .isLength({ min: 3, max: 100 }).withMessage("Dispatch Location (Loc) must be between 3 and 100 characters")
            .matches(/^([^\\"])+$/).withMessage("Dispatch Location (Loc) must match the allowed pattern"),
        check("DispDtls.Pin")
            .notEmpty().withMessage("Dispatch Pin (Pin) is required")
            .isNumeric().withMessage("Dispatch Pin (Pin) must be a number")
            .isInt({ min: 100000, max: 999999 }).withMessage("Dispatch Pin (Pin) must be a 6-digit number"),
        check("DispDtls.Stcd")
            .notEmpty().withMessage("Dispatch State Code (Stcd) is required")
            .isString().withMessage("Dispatch State Code (Stcd) must be a string")
            .isLength({ min: 1, max: 2 }).withMessage("Dispatch State Code (Stcd) must be 1 or 2 characters long")
            .matches(/^(?!0+$)[0-9]{1,2}$/).withMessage("Dispatch State Code (Stcd) must be a valid state code"),

        // Shipping Details (Optional)
        // check("ShipDtls.Gstin")
        //     .optional()
        //     .isString().withMessage("Shipping GSTIN must be a string")
        //     ,
        // check("ShipDtls.LglNm")
        //     .notEmpty().withMessage("Shipping Legal Name is required")
        //     .isString().withMessage("Shipping Legal Name must be a string")
        //     .isLength({ min: 3, max: 100 }).withMessage("Shipping Legal Name must be between 3 and 100 characters")
        //     .matches(/^([^\\"])+$/).withMessage("Shipping Legal Name must match the allowed pattern"),
        // check("ShipDtls.TrdNm")
        //     .optional()
        //     .isString().withMessage("Shipping Trade Name must be a string")
        //     .isLength({ min: 3, max: 100 }).withMessage("Shipping Trade Name must be between 3 and 100 characters")
        //     .matches(/^([^\\"])+$/).withMessage("Shipping Trade Name must match the allowed pattern"),
        // check("ShipDtls.Addr1")
        //     .notEmpty().withMessage("Shipping Address 1 is required")
        //     .isString().withMessage("Shipping Address 1 must be a string")
        //     .isLength({ min: 1, max: 100 }).withMessage("Shipping Address 1 must be between 1 and 100 characters")
        //     .matches(/^([^\\"])+$/).withMessage("Shipping Address 1 must match the allowed pattern"),
        // check("ShipDtls.Addr2")
        //     .optional()
        //     .isString().withMessage("Shipping Address 2 must be a string")
        //     .isLength({ min: 3, max: 100 }).withMessage("Shipping Address 2 must be between 3 and 100 characters")
        //     .matches(/^([^\\"])+$/).withMessage("Shipping Address 2 must match the allowed pattern"),
        // check("ShipDtls.Loc")
        //     .notEmpty().withMessage("Shipping Location is required")
        //     .isString().withMessage("Shipping Location must be a string")
        //     .isLength({ min: 3, max: 100 }).withMessage("Shipping Location must be between 3 and 100 characters")
        //     .matches(/^([^\\"])+$/).withMessage("Shipping Location must match the allowed pattern"),
        // check("ShipDtls.Pin")
        //     .notEmpty().withMessage("Shipping Pin is required")
        //     .isNumeric().withMessage("Shipping Pin must be a number")
        //     .isInt({ min: 100000, max: 999999 }).withMessage("Shipping Pin must be a 6-digit number"),
        // check("ShipDtls.Stcd")
        //     .notEmpty().withMessage("Shipping State Code is required")
        //     .isString().withMessage("Shipping State Code must be a string")
        //     .isLength({ min: 1, max: 2 }).withMessage("Shipping State Code must be 1 or 2 characters long")
        //     .matches(/^(?!0+$)[0-9]{1,2}$/).withMessage("Shipping State Code must be a valid state code"),

        //items


        check("ItemList.Item.*.SlNo")
        .notEmpty().withMessage("Serial No. (SlNo) is required")
        .isString().withMessage("Serial No. (SlNo) must be a string")
        .isLength({ min: 1, max: 6 }).withMessage("Serial No. (SlNo) must be between 1 and 6 characters")
        .matches(/^\d{1,6}$/).withMessage("Serial No. (SlNo) must be numeric and up to 6 digits"),

    check("ItemList.Item.*.PrdDesc")
        .notEmpty().withMessage("Product Description (PrdDesc) is required")
        .isString().withMessage("Product Description (PrdDesc) must be a string")
        .isLength({ min: 3, max: 300 }).withMessage("Product Description (PrdDesc) must be between 3 and 300 characters"),

    check("ItemList.Item.*.IsServc")
        .notEmpty().withMessage("IsServc is required")
        .isIn(["Y", "N"]).withMessage("IsServc must be 'Y' or 'N'"),

    check("ItemList.Item.*.HsnCd")
        .notEmpty().withMessage("HSN Code (HsnCd) is required")
        .isString().withMessage("HSN Code Should be string"),

    // check("ItemList.Item.*.BchDtls.Nm")
    //     .optional()
    //     .isString().withMessage("Batch Name (Nm) must be a string"),

    // check("ItemList.Item.*.BchDtls.Expdt")
    //     .optional()
    //     .matches(/^\d{2}\/\d{2}\/\d{4}$/).withMessage("Expiry Date (Expdt) must be in DD/MM/YYYY format"),

    // check("ItemList.Item.*.BchDtls.wrDt")
    //     .optional()
    //     .matches(/^\d{2}\/\d{2}\/\d{4}$/).withMessage("wrDt must be in DD/MM/YYYY format"),

    check("ItemList.Item.*.Qty")
        .notEmpty().withMessage("Quantity (Qty) is required")
        .isFloat({ min: 0 }).withMessage("Quantity (Qty) must be a positive number"),

    check("ItemList.Item.*.UnitPrice")
        .notEmpty().withMessage("Unit Price (UnitPrice) is required")
        .isFloat({ min: 0 }).withMessage("Unit Price (UnitPrice) must be a positive number"),

    check("ItemList.Item.*.TotAmt")
        .notEmpty().withMessage("Total Amount (TotAmt) is required")
        .isFloat({ min: 0 }).withMessage("Total Amount (TotAmt) must be a positive number"),

    check("ItemList.Item.*.IgstRt")
        .optional()
        .isFloat({ min: 0 }).withMessage("IGST Rate (IgstRt) must be a positive number"),

    check("ItemList.Item.*.IgstAmt")
        .optional()
        .isFloat({ min: 0 }).withMessage("IGST Amount (IgstAmt) must be a positive number"),

    check("ItemList.Item.*.CgstRt")
        .optional()
        .isFloat({ min: 0 }).withMessage("CGST Rate (CgstRt) must be a positive number"),

    check("ItemList.Item.*.CgstAmt")
        .optional()
        .isFloat({ min: 0 }).withMessage("CGST Amount (CgstAmt) must be a positive number"),

    check("ItemList.Item.*.SgstRt")
        .optional()
        .isFloat({ min: 0 }).withMessage("SGST Rate (SgstRt) must be a positive number"),

    check("ItemList.Item.*.SgstAmt")
        .optional()
        .isFloat({ min: 0 }).withMessage("SGST Amount (SgstAmt) must be a positive number"),

    check("ItemList.Item.*.TotItemVal")
        .notEmpty().withMessage("Total Item Value (TotItemVal) is required")
        .isFloat({ min: 0 }).withMessage("Total Item Value (TotItemVal) must be a positive number"),

    check("ItemList.Item.*.OrgCntry")
        .notEmpty().withMessage("Origin Country (OrgCntry) is required")
        .isString().withMessage("Origin Country (OrgCntry) must be a string")
        .isLength({ min: 2, max: 3 }).withMessage("Origin Country (OrgCntry) must be 2 or 3 characters"),

    // check("ItemList.Item.*.AttribDtls.*.Nm")
    //     .notEmpty().withMessage("Attribute Name (AttribDtls.Nm) is required")
    //     .isString().withMessage("Attribute Name (AttribDtls.Nm) must be a string"),

    // check("ItemList.Item.*.AttribDtls.*.Val")
    //     .notEmpty().withMessage("Attribute Value (AttribDtls.Val) is required")
    //     .isString().withMessage("Attribute Value (AttribDtls.Val) must be a string"),


        // check("ItemList.Item.*.SlNo")
        //     .notEmpty().withMessage("Serial No. (SlNo) is required")
        //     .isString().withMessage("Serial No. (SlNo) must be a string")
        //     .isLength({ min: 1, max: 6 }).withMessage("Serial No. (SlNo) must be between 1 and 6 characters")
        //     .matches(/^([0-9]{1,6})$/).withMessage("Serial No. (SlNo) must be numeric and up to 6 digits"),

        // check("ItemList.Item.*.PrdDesc")
        //     .optional()
        //     .isString().withMessage("Product Description (PrdDesc) must be a string")
        //     .isLength({ min: 3, max: 300 }).withMessage("Product Description (PrdDesc) must be between 3 and 300 characters")
        //     .matches(/^([^\\\"])*$/).withMessage("Product Description (PrdDesc) must not contain quotes"),

        // check("ItemList.Item.*.IsServc")
        //     .notEmpty().withMessage("IsServc is required")
        //     .isString().withMessage("IsServc must be a string")
        //     .isIn(["Y", "N"]).withMessage("IsServc must be 'Y' or 'N'"),

        // check("ItemList.Item.*.HsnCd")
        //     .notEmpty().withMessage("HSN Code (HsnCd) is required")
        //     .isString().withMessage("HSN Code (HsnCd) must be a string")
        //     .isLength({ min: 4, max: 8 }).withMessage("HSN Code (HsnCd) must be 4, 6, or 8 digits")
        //     .matches(/^(?!0+$)([0-9]{4}|[0-9]{6}|[0-9]{8})$/).withMessage("Invalid HSN Code format"),

        // check("ItemList*.Barcde")
        //     .optional()
        //     .isString().withMessage(" (Barcde) is not a string datatype")
        //     .isLength({ min: 3, max: 30 }).withMessage("(Barcde) must be between 3 to 30")
        //     .matches(/^([^\\\"])*$/).withMessage("check the given barcode, must not contain quotes"),
        // check("ItemList.*.Qty")
        //     .optional()
        //     .isNumeric().withMessage("Quantity must be number")
        //     .isFloat({ min: 0, max: 999999999999.999 }).withMessage("Unit Price (Quantity) must be between 0 and 999999999999.999"),
        // check("ItemList.*.FreeQty")
        //     .optional()
        //     .isNumeric().withMessage("FreeQty must be number")
        //     .isFloat({ min: 0, max: 999999999999.999 }).withMessage("  (FreeQty) must be between 0 and 999999999999.999"),
        // check("ItemList.*.Unit")
        //     .optional()
        //     .isString().withMessage("Unit must be string")
        //     .isLength({ min: 3, max: 8 }).withMessage("Length must be 3 to 8 characters only")
        //     .matches(/^([A-Z|a-z]{3,8})$/).withMessage("(Unit) must not contain quotes"),
        // check("ItemList.*.UnitPrice")
        //     .notEmpty().withMessage("Unit Price (UnitPrice) is required")
        //     .isFloat({ min: 0, max: 999999999999.999 }).withMessage("Unit Price (UnitPrice) must be between 0 and 999999999999.999"),

        // check("ItemList.*.TotAmt")
        //     .isNumeric().withMessage("Total Amount (TotAmt) must be number")
        //     .notEmpty().withMessage("Total Amount (TotAmt) is required")
        //     .isFloat({ min: 0, max: 999999999999.99 }).withMessage("Total Amount (TotAmt) must be between 0 and 999999999999.99"),

        // check("ItemList.*.Discount")
        //     .optional()
        //     .isNumeric().withMessage("Total Amount (TotAmt) must be number")
        //     .isFloat({ min: 0, max: 999999999999.99 }).withMessage("Total Amount (TotAmt) must be between 0 and 999999999999.99"),

        // check("ItemList.*.PreTaxVal")
        //     .optional()
        //     .isNumeric().withMessage("pre tax value (PreTaxVal) must be number")
        //     .isFloat({ min: 0, max: 999999999999.99 }).withMessage("pre tax value (PreTaxVal) must be between 0 and 999999999999.99"),

        // check("ItemList.*.AssAmt")
        //     .notEmpty().withMessage("Taxable Value (AssAmt) is required")
        //     .isFloat({ min: 0, max: 999999999999.99 }).withMessage("Taxable Value (AssAmt) must be between 0 and 999999999999.99"),

        // check("ItemList.*.GstRt")
        //     .notEmpty().withMessage("GST Rate (GstRt) is required")
        //     .isFloat({ min: 0, max: 999.999 }).withMessage("GST Rate (GstRt) must be between 0 and 999.999"),

        // check("ItemList.*.IgstAmt")
        //     .optional()
        //     .isNumeric().withMessage("IGST value (IgstAmt) must be number")
        //     .isFloat({ min: 0, max: 999999999999.99 }).withMessage("IGST value (IgstAmt)) must be between 0 and 999999999999.99"),

        // check("ItemList.*.CgstAmt")
        //     .optional()
        //     .isNumeric().withMessage("CGST value (CgstAmt) must be number")
        //     .isFloat({ min: 0, max: 999999999999.99 }).withMessage("CGST value (CgstAmt)) must be between 0 and 999999999999.99"),

        // check("ItemList.*.SgstAmt")
        //     .optional()
        //     .isNumeric().withMessage("SGST value (SgstAmt) must be number")
        //     .isFloat({ min: 0, max: 999999999999.99 }).withMessage("SGST value (SgstAmt)) must be between 0 and 999999999999.99"),

        // check("ItemList.*.CesRt")
        //     .optional()
        //     .isNumeric().withMessage("Cess Rate (CesRt) must be number")
        //     .isFloat({ min: 0, max: 999.99 }).withMessage("Cess Rate (CesRt)) must be between 0 and 999.99"),

        // check("ItemList.*.CesAmt")
        //     .optional()
        //     .isNumeric().withMessage("Cess Amount(Advalorem) must be number")
        //     .isFloat({ min: 0, max: 999999999999.99 }).withMessage("Cess Amount(Advalorem) must be between 0 and 999999999999.99"),

        // check("ItemList.*.CesNonAdvlAmt")
        //     .optional()
        //     .isNumeric().withMessage("Cess Non-Advol Amount must be number")
        //     .isFloat({ min: 0, max: 999999999999.99 }).withMessage("Cess Non-Advol Amount must be between 0 and 999999999999.99"),

        // check("ItemList.*.StateCesAmt")
        //     .optional()
        //     .isNumeric().withMessage("State CESS Amount (StateCesAmt) must be number")
        //     .isFloat({ min: 0, max: 999999999999.99 }).withMessage("State CESS Amount (StateCesAmt)) must be between 0 and 999999999999.99"),

        // check("ItemList.*.CesNonAdvlAmt")
        //     .optional()
        //     .isNumeric().withMessage("Cess Non-Advol Amount must be number")
        //     .isFloat({ min: 0, max: 999999999999.99 }).withMessage("Cess Non-Advol Amount must be between 0 and 999999999999.99"),

        // check("ItemList.*.StateCesNonAdvlAmt")
        //     .optional()
        //     .isNumeric().withMessage("State CESS Non Adval Amount (StateCesNonAdvlAmt) must be number")
        //     .isFloat({ min: 0, max: 999999999999.99 }).withMessage("State CESS Non Adval Amount (StateCesNonAdvlAmt)) must be between 0 and 999999999999.99"),

        // check("ItemList.*.OthChrg")
        //     .optional()
        //     .isNumeric().withMessage("Other Charges (OthChrg) must be number")
        //     .isFloat({ min: 0, max: 999999999999.99 }).withMessage("Other Charges (OthChrg)) must be between 0 and 999999999999.99"),

        // check("ItemList.*.TotItemVal")
        //     .notEmpty().withMessage("Total Item Value (TotItemVal) is required")
        //     .isFloat({ min: 0, max: 999999999999.99 }).withMessage("Total Item Value (TotItemVal) must be between 0 and 999999999999.99"),

        // check("ItemList.*.OrdLineRef")
        //     .optional()
        //     .isString().withMessage("OrdLineRef must be string")
        //     .isLength({ min: 1, max: 50 }).withMessage("Length must be 1 to 50 characters only")
        //     .matches(/^([^\\\"])*$/).withMessage("(OrdLineRef) must not contain quotes"),

        // check("ItemList.*.OrgCntry")
        //     .optional()
        //     .isString().withMessage("OrgCntry must be string")
        //     .isLength({ min: 2, max: 2 }).withMessage("Length must be 2 to 2 characters only")
        //     .matches(/^([A-Z|a-z]{2})$/).withMessage("(OrgCntry) must not contain quotes"),

        // check("ItemList.*.PrdSlNo")
        //     .optional()
        //     .isString().withMessage("PrdSlNo must be string")
        //     .isLength({ min: 2, max: 2 }).withMessage("Length must be 2 to 2 characters only")
        //     .matches(/^([^\\\"])*$/).withMessage("(PrdSlNo) must not contain quotes"),

        // check("ItemList.*.BchDtls.Nm")
        //     .notEmpty().withMessage("Batch number (BchDtls.Nm) is required")
        //     .isString().withMessage("Batch number (BchDtls.Nm) must be string")
        //     .isLength({ min: 3, max: 20 }).withMessage("Batch number (BchDtls.Nm) characters must between 3 to 20 only")
        //     .matches(/^([^\\\"])*$/).withMessage("(BchDtls.Nm) must not contain quotes"),

        // check("ItemList.*.BchDtls.ExpDt")
        //     .optional()
        //     .isString().withMessage("Batch Expiry Date (BchDtls.ExpDt) must be string")
        //     .isLength({ min: 10, max: 10 }).withMessage("Batch number (BchDtls.ExpDt) characters must between 3 to 20 only")
        //     .matches(/^[0-3][0-9]\/[0-1][0-9]\/[2][0][1-2][0-9]$/).withMessage("(BchDtls.ExpDt) must not contain quotes"),

        // check("ItemList.*.BchDtls.WrDt")
        //     .optional()
        //     .isString().withMessage("Warranty Date (BchDtls.WrDt) must be string")
        //     .isLength({ min: 10, max: 10 }).withMessage("Batch number (BchDtls.WrDt) characters must between 3 to 20 only")
        //     .matches(/^[0-3][0-9]\/[0-1][0-9]\/[2][0][1-2][0-9]$/).withMessage("(BchDtls.WrDt) must not contain quotes"),

            
        // check("ItemList.*.AttribDtls.Nm")
        // .optional()
        // .isString().withMessage("Attribute name of the item (AttribDtls.Nm) must be string")
        // .isLength({ min: 1, max: 100 }).withMessage("Batch number (AttribDtls.Nm) characters must between 3 to 20 only")
        // .matches(/^([^\\\"])*$/).withMessage("(BchDtls.WrDt) must not contain quotes"),

        // check("ItemList.*.AttribDtls.Val")
        // .optional()
        // .isString().withMessage("Attribute value of the item (AttribDtls.Val) must be string")
        // .isLength({ min: 1, max: 100 }).withMessage("Batch number (AttribDtls.Val) characters must between 3 to 20 only")
        // .matches(/^([^\\\"])*$/).withMessage("(AttribDtls.Val) must not contain quotes"),


        // check("ItemList.*.AttribDtls.Val")
        // .optional()
        // .isString().withMessage("Attribute value of the item (AttribDtls.Val) must be string")
        // .isLength({ min: 1, max: 100 }).withMessage("Batch number (AttribDtls.Val) characters must between 3 to 20 only")
        // .matches(/^([^\\\"])*$/).withMessage("(AttribDtls.Val) must not contain quotes"),

        // check("ItemList.*.AttribDtls.Val")
        // .optional()
        // .isString().withMessage("Attribute value of the item (AttribDtls.Val) must be string")
        // .isLength({ min: 1, max: 100 }).withMessage("Batch number (AttribDtls.Val) characters must between 3 to 20 only")
        // .matches(/^([^\\\"])*$/).withMessage("(AttribDtls.Val) must not contain quotes"),

    //     check("ValDtls.*.AssVal")
    //     .notEmpty().withMessage("valDtls Assval is required")
    //     .isNumeric().withMessage("valDtls Assval must be number")
    //         .isFloat({ min: 0, max: 99999999999999.99 }).withMessage("ValDtls (AssVal) must be between 0 and 999999999999.999")
    //    ,
    //    check("ValDtls.*.TotInvVal")
    //    .notEmpty().withMessage("TotInvVal  is required")
    //    .isNumeric().withMessage("TotInvVal must be number")
    //        .isFloat({ min: 0, max: 99999999999999.99 }).withMessage("TotInvVal must be between 0 and 999999999999.999")
    //   ,
        // // Value Details
        // check("ValDtls.TotInvVal").isNumeric().withMessage("Total Invoice Value is required"),

        // // Payment Details
        // check("PayDtls.Crday").isNumeric().withMessage("Credit Days (Crday) must be a number"),
        // check("PayDtls.Paidamt").isNumeric().withMessage("Paid Amount must be a number"),
        // check("PayDtls.Paymtdue").isNumeric().withMessage("Payment Due must be a number"),

        // // Reference Details
        // check("RefDtls.DocPerdDtls.InvStDt")
        //     .optional()
        //     .custom((value) => value === null || typeof value === "string")
        //     .withMessage("InvStDt should be null or a valid string"),
        // check("RefDtls.PrecDocDtls.*.InvNo")
        //     .optional()
        //     .custom((value) => value === null || typeof value === "string")
        //     .withMessage("Previous Document Number (InvNo) should be null or a valid string"),

        // // Additional Document Details (Optional)
        // check("AddlDocDtls.*.Url")
        //     .optional()
        //     .isString()
        //     .withMessage("Url should be a string"),

        // // Export Details (Optional)
        // check("ExpDtls.ShipBNo")
        //     .optional()
        //     .custom((value) => value === null || typeof value === "string")
        //     .withMessage("ShipBNo should be null or a valid string"),

        // // E-Way Bill Details
        // check("EwbDtls.Transid").notEmpty().withMessage("Transid is required"),
        // check("EwbDtls.Transdocno")
        //     .custom((value) => value === null || (typeof value === "string" && value.trim() !== ""))
        //     .withMessage("Transdocno should be either null or a valid string"),
        // check("EwbDtls.TransdocDt")
        //     .custom((value) => value === null || (typeof value === "string" && value.trim() !== ""))
        //     .withMessage("TransdocDt should be either null or a valid string"),
    ]

}

