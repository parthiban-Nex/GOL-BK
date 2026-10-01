// const emailConfig = {
//   service: 'gmail',
//   host: 'smtp.gmail.com',
//   port: 465,
//   secure: true,
//   auth: {
//     user: 'roushankumar.singh@nesh.live', // Replace with your email
//     pass: 'ayzq dzfz ctpl toqk', // Replace with your email password or app password if using Gmail
//   },
// };


const emailConfig = {
  service: 'gmail',
  host: 'smtp.office365.com',
  port: 587,
  secure: false,
  auth: {
    user: 'info@mytvs.in', // Replace with your email
    pass: 'G7m$Q2r!X', // Replace with your email password or app password if using Gmail
  },
};

export default emailConfig;

//issue with credentials 
// const emailConfig = {
//   service: 'office365',
//   host: 'smtp.office365.com',
//   port: 587,
//   secure: false, // TLS uses STARTTLS on port 587
//   auth: {
//     user: 'autogen@tvs.in',
//     pass: 'Year2006',
//   },
// };

// export default emailConfig;

