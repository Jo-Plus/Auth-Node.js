const EmailTemplate = (link) => {
  return `
  <div dir="ltr" style="
    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
    background-color: #f4f7f9;
    padding: 40px 20px;
    color: #333;
    line-height: 1.6;
  ">
    <div style="
      max-width: 550px;
      margin: 0 auto;
      background-color: #ffffff;
      border-radius: 12px;
      overflow: hidden;
      box-shadow: 0 4px 15px rgba(0,0,0,0.05);
      border: 1px solid #e1e8ed;
    ">
      <div style="padding: 40px 20px; text-align: center; background-color: #fff;">
        <img src="https://res.cloudinary.com/dm0ifn7dw/image/upload/v1769986348/TASKIFY_AI_Color_ntvdua.png" 
             alt="Taskify Logo" 
             style="max-width: 160px; height: auto;" />
      </div>

      <div style="padding: 0 40px 40px 40px; text-align: center;">
        <h2 style="
          color: #1a1a1a;
          font-size: 24px;
          margin-bottom: 15px;
          font-weight: 700;
        ">Verify Your Email</h2>
        
        <p style="
          color: #666;
          font-size: 16px;
          margin-bottom: 30px;
        ">
          Welcome to <strong>Taskify AI</strong>! We're excited to have you. 
          To get started, please confirm your email address by clicking the button below.
        </p>

        <a href="${link}" style="
          display: inline-block;
          background-color: #4F46E5;
          color: #ffffff;
          padding: 14px 32px;
          border-radius: 8px;
          text-decoration: none;
          font-weight: 600;
          font-size: 16px;
          transition: background-color 0.3s ease;
        ">
          Verify Email Address
        </a>

        <hr style="border: 0; border-top: 1px solid #eee; margin: 40px 0;" />

        <p style="color: #999; font-size: 13px; text-align: left;">
          If you’re having trouble clicking the button, copy and paste the URL below into your web browser:
          <br />
          <span style="color: #4F46E5; word-break: break-all;">${link}</span>
        </p>
      </div>

      <div style="
        background-color: #f9fafb;
        padding: 20px;
        text-align: center;
        font-size: 12px;
        color: #9ca3af;
      ">
        &copy; ${new Date().getFullYear()} Taskify AI. All rights reserved. <br />
        If you didn't create an account, you can safely ignore this email.
      </div>
    </div>
  </div>
  `;
};

module.exports = EmailTemplate;