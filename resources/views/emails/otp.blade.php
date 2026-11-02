<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Prince Eduhub - Password Reset OTP</title>
    <style>
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background-color: #f1f5f9;
            margin: 0;
            padding: 24px;
            color: #1e293b;
        }
        .container {
            max-width: 520px;
            margin: 0 auto;
            background: #ffffff;
            border-radius: 16px;
            overflow: hidden;
            border: 1px solid #e2e8f0;
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
        }
        .header {
            background: linear-gradient(135deg, #1e1b4b 0%, #312e81 100%);
            padding: 32px 24px;
            text-align: center;
            color: #ffffff;
        }
        .header h1 {
            margin: 0;
            font-size: 22px;
            font-weight: 800;
            letter-spacing: 0.5px;
        }
        .header p {
            margin: 6px 0 0;
            font-size: 13px;
            color: #c7d2fe;
        }
        .body {
            padding: 32px 28px;
        }
        .greeting {
            font-size: 16px;
            font-weight: 600;
            color: #0f172a;
            margin-bottom: 12px;
        }
        .text {
            font-size: 14px;
            line-height: 1.6;
            color: #475569;
            margin-bottom: 24px;
        }
        .otp-box {
            background: #eef2ff;
            border: 2px dashed #6366f1;
            border-radius: 12px;
            padding: 20px;
            text-align: center;
            margin: 24px 0;
        }
        .otp-label {
            font-size: 12px;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 1px;
            color: #4338ca;
            margin-bottom: 8px;
        }
        .otp-code {
            font-family: 'Courier New', Courier, monospace;
            font-size: 38px;
            font-weight: 900;
            letter-spacing: 10px;
            color: #1e1b4b;
        }
        .warning {
            font-size: 12px;
            color: #64748b;
            background: #f8fafc;
            border-left: 3px solid #f59e0b;
            padding: 10px 14px;
            border-radius: 4px;
            margin-top: 20px;
            line-height: 1.5;
        }
        .footer {
            background: #f8fafc;
            padding: 20px 24px;
            text-align: center;
            border-top: 1px solid #e2e8f0;
            font-size: 12px;
            color: #94a3b8;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>PRINCE EDUHUB</h1>
            <p>Google Business Reviews & Staff Management Portal</p>
        </div>
        <div class="body">
            <div class="greeting">नमस्ते {{ $user->name ?? 'Team Member' }},</div>
            <div class="text">
                आपके खाते का पासवर्ड रीसेट करने के लिए One-Time Password (OTP) नीचे दिया गया है:
            </div>
            
            <div class="otp-box">
                <div class="otp-label">Password Reset Verification Code</div>
                <div class="otp-code">{{ $otp }}</div>
            </div>

            <div class="warning">
                <strong>ध्यान दें:</strong> यह कोड केवल <strong>15 मिनट</strong> के लिए मान्य है। अपनी सुरक्षा के लिए यह OTP किसी के साथ शेयर न करें। यदि आपने पासवर्ड रीसेट का अनुरोध नहीं किया था, तो कृपया तुरंत एडमिनिस्ट्रेटर से संपर्क करें।
            </div>
        </div>
        <div class="footer">
            &copy; {{ date('Y') }} Prince Eduhub &bull; Coaching In Sikar. All rights reserved.<br>
            Palwas Road & Piprali Road, Sikar, Rajasthan 332001
        </div>
    </div>
</body>
</html>
