<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml" lang="en">
<head>
    <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Prince Edu Hub - Verification Code</title>
    <!--[if mso]>
    <style type="text/css">
        body, table, td {font-family: Arial, Helvetica, sans-serif !important;}
    </style>
    <![endif]-->
</head>
<body style="margin: 0; padding: 0; background-color: #f1f5f9; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; -webkit-font-smoothing: antialiased;">
    <table border="0" cellpadding="0" cellspacing="0" width="100%" style="table-layout: fixed; background-color: #f1f5f9; padding: 24px 8px;">
        <tr>
            <td align="center">
                <!-- Main Container (Slim side margins for maximum readability) -->
                <table border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 560px; background-color: #ffffff; border-radius: 16px; overflow: hidden; border: 1px solid #e2e8f0; box-shadow: 0 10px 25px -5px rgba(15, 23, 42, 0.08), 0 8px 10px -6px rgba(15, 23, 42, 0.04);">
                    
                    <!-- Header Banner -->
                    <tr>
                        <td align="center" style="background: linear-gradient(135deg, #1e1b4b 0%, #1e3a8a 50%, #2563eb 100%); padding: 28px 18px 24px 18px; color: #ffffff;">
                            <table border="0" cellpadding="0" cellspacing="0" width="100%">
                                <tr>
                                    <td align="center">
                                        <!-- Emblem Icon -->
                                        <div style="display: inline-block; width: 56px; height: 56px; background: rgba(255, 255, 255, 0.15); backdrop-filter: blur(8px); border-radius: 14px; border: 1px solid rgba(255, 255, 255, 0.25); line-height: 56px; text-align: center; margin-bottom: 12px; box-shadow: 0 8px 16px rgba(0,0,0,0.15);">
                                            <span style="font-size: 26px;">🎓</span>
                                        </div>
                                    </td>
                                </tr>
                                <tr>
                                    <td align="center">
                                        <h1 style="margin: 0; font-size: 22px; font-weight: 800; letter-spacing: 0.5px; color: #ffffff; text-transform: uppercase;">
                                            PRINCE EDU HUB
                                        </h1>
                                        <p style="margin: 4px 0 0; font-size: 13px; font-weight: 500; color: #c7d2fe; letter-spacing: 0.3px;">
                                            Google Business Profile &amp; Staff Management Portal
                                        </p>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>

                    <!-- Body Content -->
                    <tr>
                        <td style="padding: 28px 18px 24px 18px;">
                            <table border="0" cellpadding="0" cellspacing="0" width="100%">
                                <tr>
                                    <td>
                                        <h2 style="margin: 0 0 10px 0; font-size: 17px; font-weight: 700; color: #0f172a;">
                                            Dear {{ $user->name ?? 'Team Member' }},
                                        </h2>
                                        <p style="margin: 0 0 20px 0; font-size: 14px; line-height: 1.6; color: #475569;">
                                            We received a request to verify your account and reset your password for the Prince Edu Hub Portal. Please use the following <strong>6-digit One-Time Password (OTP)</strong> to complete the verification:
                                        </p>
                                    </td>
                                </tr>

                                <!-- OTP Box with Copyable Code & Direct Action Button -->
                                <tr>
                                    <td align="center" style="padding: 4px 0 22px 0;">
                                        <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background: linear-gradient(180deg, #f0fdf4 0%, #eff6ff 100%); border: 2px dashed #3b82f6; border-radius: 14px; padding: 22px 14px; text-align: center;">
                                            <tr>
                                                <td align="center">
                                                    <span style="font-size: 11px; font-weight: 700; color: #2563eb; text-transform: uppercase; letter-spacing: 1.5px; display: block; margin-bottom: 8px;">
                                                        ONE-TIME VERIFICATION CODE
                                                    </span>
                                                    
                                                    <!-- 1-Tap Copyable Code Box -->
                                                    <div style="display: inline-block; background: #ffffff; border: 1.5px solid #cbd5e1; border-radius: 10px; padding: 10px 20px; margin: 4px 0 16px 0; box-shadow: 0 2px 4px rgba(0,0,0,0.04);">
                                                        <span style="font-family: 'Courier New', Courier, monospace; font-size: 40px; font-weight: 900; letter-spacing: 12px; color: #1e1b4b; user-select: all; -webkit-user-select: all; -moz-user-select: all; -ms-user-select: all; display: inline-block; padding-left: 12px; cursor: pointer;" title="Select and copy code">
                                                            {{ $otp }}
                                                        </span>
                                                    </div>

                                                    <!-- Direct Action Button (Opens Password Add / Reset Page with Pre-Filled OTP) -->
                                                    <table border="0" cellpadding="0" cellspacing="0" style="margin: 0 auto 12px auto;">
                                                        <tr>
                                                            <td align="center" style="border-radius: 8px; background-color: #2563eb;">
                                                                <a href="https://app.coachingsinsikar.com/login?reset_otp={{ $otp }}&email={{ urlencode($user->email ?? '') }}&identifier={{ urlencode($user->email ?? '') }}" target="_blank" style="display: inline-block; padding: 11px 26px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 13.5px; font-weight: 700; color: #ffffff; text-decoration: none; border-radius: 8px; letter-spacing: 0.2px;">
                                                                    Verify &amp; Reset Password &rarr;
                                                                </a>
                                                            </td>
                                                        </tr>
                                                    </table>

                                                    <span style="display: inline-block; font-size: 11px; font-weight: 600; color: #059669; background: #dcfce7; padding: 3px 10px; border-radius: 9999px; border: 1px solid #bbf7d0;">
                                                        ⏱ Valid for 15 minutes only
                                                    </span>
                                                </td>
                                            </tr>
                                        </table>
                                    </td>
                                </tr>

                                <!-- Security Instructions Card -->
                                <tr>
                                    <td>
                                        <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #f8fafc; border-radius: 12px; border: 1px solid #e2e8f0; padding: 14px 14px;">
                                            <tr>
                                                <td style="font-size: 12.5px; font-weight: 700; color: #1e293b; padding-bottom: 6px;">
                                                    🔒 Security Instructions:
                                                </td>
                                            </tr>
                                            <tr>
                                                <td style="font-size: 12.5px; line-height: 1.6; color: #64748b;">
                                                    • This verification code is active for <strong>15 minutes only</strong>.<br />
                                                    • Never share this OTP with anyone. Prince Edu Hub administrators will never ask for your code.<br />
                                                    • If you did not request this verification, please contact your portal administrator immediately.
                                                </td>
                                            </tr>
                                        </table>
                                    </td>
                                </tr>

                            </table>
                        </td>
                    </tr>

                    <!-- Footer with Compact Padding -->
                    <tr>
                        <td style="background-color: #f1f5f9; padding: 20px 18px; border-top: 1px solid #e2e8f0; text-align: center;">
                            <p style="margin: 0 0 6px 0; font-size: 12px; font-weight: 600; color: #475569;">
                                Prince Edu Hub • Pioneer in Quality Education
                            </p>
                            <p style="margin: 0 0 8px 0; font-size: 11px; color: #94a3b8; line-height: 1.5;">
                                Palwas Road &amp; Piprali Road, Sikar, Rajasthan 332001<br />
                                Official Portal: <a href="https://app.coachingsinsikar.com" style="color: #2563eb; text-decoration: none; font-weight: 500;">app.coachingsinsikar.com</a>
                            </p>
                            <p style="margin: 0; font-size: 10px; color: #cbd5e1;">
                                &copy; {{ date('Y') }} Prince Edu Hub. All rights reserved.
                            </p>
                        </td>
                    </tr>

                </table>
            </td>
        </tr>
    </table>
</body>
</html>
