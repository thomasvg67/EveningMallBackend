import path from 'path';
import fs from 'fs';
import axios from 'axios';
import { fileURLToPath } from 'url';
import transporter from '../utils/emailTransport.js';
import Newsletter from '../models/sbnewsltr.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const subscribeNewsletter = async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ message: 'Email is required.' });
  }

  try {
    let existing = await Newsletter.findOne({ email });

    if (existing && existing.sts === 1) {
      return res.status(400).json({ message: 'Already subscribed.' });
    }

    let subscriber;

    if (existing && existing.sts === 0) {
      existing.sts = 1;
      subscriber = await existing.save();
    } else if (existing && existing.sts === 1) {
      return res.status(400).json({ message: 'Already subscribed.' });
    } else {
      subscriber = await Newsletter.create({ email });
    }


    const templatePath = path.join(__dirname, '../templates/emailtemplate.html');
    const htmlContent = fs.readFileSync(templatePath, 'utf8');

    const unsubscribeLink = `${process.env.FRONTEND_URL}/unsubscribed/${subscriber._id}`;
    const personalizedHtml = htmlContent.replace(/__UNSUBSCRIBE_LINK__/g, unsubscribeLink);

    await transporter.sendMail({
      from: `" <${process.env.MAIL_USER}>`,
      to: email,
      subject: 'Welcome to Eveningmall Newsletter!',
      html: personalizedHtml
    });

    res.status(200).json({ message: 'Subscribed and email sent.' });
  } catch (error) {
    console.error('Subscription error:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
};

export const unsubscribeNewsletter = async (req, res) => {
  try {
    const { id } = req.params;

    const subscriber = await Newsletter.findById(id);
    if (!subscriber) {
      return res.status(404).send('Invalid unsubscribe link.');
    }

    if (subscriber.sts === 0) {
      return res.send('You have already unsubscribed.');
    }

    subscriber.sts = 0;
    await subscriber.save();

    // res.redirect(`${process.env.FRONTEND_URL}/unsubscribed`);
    res.send('You have successfully unsubscribed from our newsletter.');



  } catch (err) {
    console.error('Unsubscribe error:', err);
    res.status(500).send('Server error.');
  }
};

// Contact form controller
export const sendContactMessage = async (req, res) => {
  const { name, email, subject, message, captchaToken } = req.body;

  if (!name || !email || !subject || !message || !captchaToken) {
    return res.status(400).json({ message: 'All fields and CAPTCHA are required.' });
  }

  //Verify CAPTCHA with Google
  try {
    const verifyResponse = await axios.post(
      'https://www.google.com/recaptcha/api/siteverify',
      new URLSearchParams({
        secret: process.env.GOOGLE_CAPTCHA_SECRET,
        response: captchaToken,
      })
    );

    const isHuman = verifyResponse.data.success;
    if (!isHuman) {
      return res.status(400).json({ message: 'CAPTCHA verification failed. Are you a bot?' });
    }
  } catch (err) {
    console.error('❌ CAPTCHA error:', err.message);
    return res.status(500).json({ message: 'CAPTCHA verification error. Please try again later.' });
  }

  const templatePath = path.join(__dirname, '../templates/emalcontact.html');
  let htmlTemplate = fs.readFileSync(templatePath, 'utf8');

  // Replace dynamic placeholders
  htmlTemplate = htmlTemplate
    .replace(/__NAME__/g, name)
    .replace(/__EMAIL__/g, email)
    .replace(/__SUBJECT__/g, subject)
    .replace(/__MESSAGE__/g, message.replace(/\n/g, '<br/>'));

  try {
    await transporter.sendMail({
      from: `"Evening Mall Contact" <${process.env.MAIL_USER}>`,
      to: process.env.COMPANY_EMAIL,
      replyTo: email,
      subject: `[Contact] ${subject}`,
      html: htmlTemplate

    });

    res.status(200).json({ message: 'Message sent successfully!' });
  } catch (err) {
    console.error('❌ Contact form error:', err);
    res.status(500).json({ message: 'Failed to send message. Please try again later.' });
  }
};
