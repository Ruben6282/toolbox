import { useParams, Link } from "react-router-dom";
import { Header } from "@/components/Header";
import { AdSense } from "@/components/AdSense";
import { tools, categories } from "@/data/tools";
import { ArrowLeft, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import * as Icons from "lucide-react";
import { LucideIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { CaseConverter } from "@/components/tools/CaseConverter";
import { WordCounter } from "@/components/tools/WordCounter";
import { TextDiff } from "@/components/tools/TextDiff";
import { LoremIpsum } from "@/components/tools/LoremIpsum";
import { JsonFormatter } from "@/components/tools/JsonFormatter";
import { Base64Encoder } from "@/components/tools/Base64Encoder";
import { UuidGenerator } from "@/components/tools/UuidGenerator";
import { PasswordGenerator } from "@/components/tools/PasswordGenerator";
import { UrlEncoder } from "@/components/tools/UrlEncoder";
import { TimestampConverter } from "@/components/tools/TimestampConverter";
import { QrGenerator } from "@/components/tools/QrGenerator";
import { PercentageCalculator } from "@/components/tools/PercentageCalculator";
import { RandomNumber } from "@/components/tools/RandomNumber";
import { UnitConverter } from "@/components/tools/UnitConverter";
import { HtmlEncoder } from "@/components/tools/HtmlEncoder";
import { RegexTester } from "@/components/tools/RegexTester";
import { ColorPicker } from "@/components/tools/ColorPicker";
import { MarkdownPreview } from "@/components/tools/MarkdownPreview";
import { DateCalculator } from "@/components/tools/DateCalculator";
import { LoanCalculator } from "@/components/tools/LoanCalculator";
import { ImageResizer } from "@/components/tools/ImageResizer";
import { HashGenerator } from "@/components/tools/HashGenerator";
import { BinaryConverter } from "@/components/tools/BinaryConverter";
import { CssMinifier } from "@/components/tools/CssMinifier";
import { JsMinifier } from "@/components/tools/JsMinifier";
import { BmiCalculator } from "@/components/tools/BmiCalculator";
import { AgeCalculator } from "@/components/tools/AgeCalculator";
import { StringReverser } from "@/components/tools/StringReverser";
import { WhitespaceRemover } from "@/components/tools/WhitespaceRemover";
import { DuplicateRemover } from "@/components/tools/DuplicateRemover";
import { SortLines } from "@/components/tools/SortLines";
import { ImageToBase64 } from "@/components/tools/ImageToBase64";
import { GradientGenerator } from "@/components/tools/GradientGenerator";
import { JwtDecoder } from "@/components/tools/JwtDecoder";
import { TextToSlug } from "@/components/tools/TextToSlug";
import { CharacterCounter } from "@/components/tools/CharacterCounter";
import { RandomNamePicker } from "@/components/tools/RandomNamePicker";
import { DiceRoller } from "@/components/tools/DiceRoller";
import { CoinFlip } from "@/components/tools/CoinFlip";
import { RandomYesNo } from "@/components/tools/RandomYesNo";
import { PrimeNumberChecker } from "@/components/tools/PrimeNumberChecker";
import { TextToBinary } from "@/components/tools/TextToBinary";
import { BinaryToText } from "@/components/tools/BinaryToText";
import { EmailValidator } from "@/components/tools/EmailValidator";
import { AsciiArtGenerator } from "@/components/tools/AsciiArtGenerator";
import { RandomWordGenerator } from "@/components/tools/RandomWordGenerator";
import { TextToSpeech } from "@/components/tools/TextToSpeech";
import { SpeechToText } from "@/components/tools/SpeechToText";
import { TipCalculator } from "@/components/tools/TipCalculator";
import { DiscountCalculator } from "@/components/tools/DiscountCalculator";
import { MortgageCalculator } from "@/components/tools/MortgageCalculator";
import { LcmGcdCalculator } from "@/components/tools/LcmGcdCalculator";
import { RomanToNumber } from "@/components/tools/RomanToNumber";
import { UsernameGenerator } from "@/components/tools/UsernameGenerator";
import { BusinessNameGenerator } from "@/components/tools/BusinessNameGenerator";
import { HtmlMinifier } from "@/components/tools/HtmlMinifier";
import { CompoundInterestCalculator } from "@/components/tools/CompoundInterestCalculator";
import { CurrencyConverter } from "@/components/tools/CurrencyConverter";
import { MetaTagGenerator } from "@/components/tools/MetaTagGenerator";
import { ImageCropper } from "@/components/tools/ImageCropper";
import { ImageGrayscale } from "@/components/tools/ImageGrayscale";
import { TwitterCharacterCounter } from "@/components/tools/TwitterCharacterCounter";
import { YouTubeTitleGenerator } from "@/components/tools/YouTubeTitleGenerator";
import { TimeZoneConverter } from "@/components/tools/TimeZoneConverter";
import { SecurePasswordGenerator } from "@/components/tools/SecurePasswordGenerator";
import { VoiceRecorder } from "@/components/tools/VoiceRecorder";
import { ImageFormatConverter } from "@/components/tools/ImageFormatConverter";
import { AddWatermark } from "@/components/tools/AddWatermark";
import { RoiCalculator } from "@/components/tools/RoiCalculator";
import { TaxCalculator } from "@/components/tools/TaxCalculator";
import { HashtagGenerator } from "@/components/tools/HashtagGenerator";
import { FortuneCookie } from "@/components/tools/FortuneCookie";
import { FuelCostCalculator } from "@/components/tools/FuelCostCalculator";
import { GpaCalculator } from "@/components/tools/GpaCalculator";
import { CalorieCalculator } from "@/components/tools/CalorieCalculator";
import { BinaryToDecimalConverter } from "@/components/tools/BinaryToDecimalConverter";
import { DecimalToBinaryConverter } from "@/components/tools/DecimalToBinaryConverter";
import { BoxShadowGenerator } from "@/components/tools/BoxShadowGenerator";
import { HexToDecimalConverter } from "@/components/tools/HexToDecimalConverter";
import { DecimalToHexConverter } from "@/components/tools/DecimalToHexConverter";
import { Magic8Ball } from "@/components/tools/Magic8Ball";
import { HtmlTableGenerator } from "@/components/tools/HtmlTableGenerator";
import { BorderRadiusGenerator } from "@/components/tools/BorderRadiusGenerator";
import { BootstrapButtonGenerator } from "@/components/tools/BootstrapButtonGenerator";
import { StopwatchTimer } from "@/components/tools/StopwatchTimer";
import { WorldClock } from "@/components/tools/WorldClock";
import { MemeGenerator } from "@/components/tools/MemeGenerator";
import { RobotsTxtGenerator } from "@/components/tools/RobotsTxtGenerator";
import { OgMetaGenerator } from "@/components/tools/OgMetaGenerator";
import { CanonicalUrlGenerator } from "@/components/tools/CanonicalUrlGenerator";
import { XmlSitemapGenerator } from "@/components/tools/XmlSitemapGenerator";
import { KeywordDensityChecker } from "@/components/tools/KeywordDensityChecker";
import { PageSpeedTest } from "@/components/tools/PageSpeedTest";
import { GoogleSerpSimulator } from "@/components/tools/GoogleSerpSimulator";
import { FacebookPostPreview } from "@/components/tools/FacebookPostPreview";
import { HashtagCounter } from "@/components/tools/HashtagCounter";
import { JavaScriptObfuscator } from "@/components/tools/JavaScriptObfuscator";
import { CountdownTimer } from "@/components/tools/CountdownTimer";
import { SleepCycleCalculator } from "@/components/tools/SleepCycleCalculator";
import { FakeNameGenerator } from "@/components/tools/FakeNameGenerator";
import { UrlSafetyChecker } from "@/components/tools/UrlSafetyChecker";
import { YouTubeThumbnailDownloader } from "@/components/tools/YouTubeThumbnailDownloader";
import { Mp3ToWavConverter } from "@/components/tools/Mp3ToWavConverter";
import { AudioCutter } from "@/components/tools/AudioCutter";
import { VideoCutter } from "@/components/tools/VideoCutter";
import { RemoveAudioFromVideo } from "@/components/tools/RemoveAudioFromVideo";

const ToolPage = () => {
  const { categoryId, toolId } = useParams();
  const tool = tools.find((t) => t.id === toolId);
  const category = tool ? categories.find((c) => c.id === tool.category) : null;

  if (!tool || !category) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container py-20 text-center">
          <h1 className="mb-4 text-4xl font-bold">Tool Not Found</h1>
          <Link to="/">
            <Button>Go Home</Button>
          </Link>
        </div>
      </div>
    );
  }

  const IconComponent = (Icons[tool.icon as keyof typeof Icons] as LucideIcon) || Icons.Wrench;
  const CategoryIconComponent = (Icons[category.icon as keyof typeof Icons] as LucideIcon) || Icons.Wrench;

  const getToolInstructions = (toolId: string) => {
    const instructions: { [key: string]: string[] } = {
      // Text Tools
      "word-counter": [
        "Paste or type your text in the input area",
        "The tool will automatically count words, characters, and paragraphs",
        "View real-time statistics as you type or paste",
        "Copy the results or use them for your writing needs"
      ],
      "case-converter": [
        "Enter your text in the input field",
        "Select the desired case conversion (uppercase, lowercase, etc.)",
        "The text will be converted instantly",
        "Copy the converted text to your clipboard"
      ],
      "string-reverser": [
        "Type or paste the text you want to reverse",
        "The tool will instantly reverse the character order",
        "View the reversed text in the output area",
        "Copy the reversed text for your use"
      ],
      "character-counter": [
        "Input your text in the provided text area",
        "View detailed character count including spaces and special characters",
        "See word count, line count, and paragraph count",
        "Use the statistics for writing requirements or social media limits"
      ],
      "duplicate-remover": [
        "Paste your text with duplicate lines in the input area",
        "Click the 'Remove Duplicates' button",
        "View the cleaned text with duplicates removed",
        "Copy the result to use in your document"
      ],
      "whitespace-remover": [
        "Paste text with extra spaces or whitespace issues",
        "The tool will automatically clean up unnecessary spaces",
        "View the cleaned text in the output area",
        "Copy the formatted text for your use"
      ],
      "ascii-art-generator": [
        "Enter the text you want to convert to ASCII art",
        "Select a font style from the available options",
        "Preview the ASCII art in real-time",
        "Copy the ASCII art to use in your projects"
      ],
      "random-word-generator": [
        "Set the number of words you want to generate",
        "Choose word length or category if available",
        "Click 'Generate Words' to create random words",
        "Use the generated words for creative writing or brainstorming"
      ],
      "lorem-ipsum": [
        "Specify the number of paragraphs or words needed",
        "Choose the type of Lorem Ipsum text (paragraphs, words, etc.)",
        "Click 'Generate' to create placeholder text",
        "Copy the generated text for your design mockups"
      ],
      "text-to-binary": [
        "Enter the text you want to convert to binary",
        "The tool will convert each character to its binary representation",
        "View the binary code in the output area",
        "Copy the binary code for your programming needs"
      ],
      "binary-to-text": [
        "Paste the binary code in the input field",
        "Ensure the binary code is properly formatted",
        "Click 'Convert' to decode the binary to text",
        "Copy the decoded text result"
      ],
      "text-to-speech": [
        "Type or paste the text you want to convert to speech",
        "Select a voice and adjust speech settings if available",
        "Click 'Play' to hear the text spoken aloud",
        "Use the audio for accessibility or learning purposes"
      ],
      "speech-to-text": [
        "Click the microphone button to start recording",
        "Speak clearly into your device's microphone",
        "The tool will convert your speech to text in real-time",
        "Copy the transcribed text for your use"
      ],
      "text-diff": [
        "Enter the original text in the first input field",
        "Enter the modified text in the second input field",
        "Click 'Compare' to highlight the differences",
        "Review the changes and copy the result if needed"
      ],
      "text-to-slug": [
        "Enter the text you want to convert to a URL slug",
        "The tool will remove special characters and spaces",
        "Convert to lowercase and replace spaces with hyphens",
        "Copy the URL-friendly slug for your website"
      ],
      "markdown-preview": [
        "Type or paste your Markdown text in the editor",
        "View the live preview of how it will render",
        "Use standard Markdown syntax for formatting",
        "Copy the rendered HTML or Markdown as needed"
      ],
      "sort-lines": [
        "Paste your text with multiple lines in the input area",
        "Choose sorting order (A-Z or Z-A)",
        "Click 'Sort Lines' to organize the text",
        "Copy the sorted text for your use"
      ],

      // Image Tools
      "image-resizer": [
        "Upload an image file using the file input or drag & drop",
        "Set the desired width and height dimensions",
        "Choose the resizing method (maintain aspect ratio, etc.)",
        "Download the resized image to your device"
      ],
      "image-cropper": [
        "Upload the image you want to crop",
        "Use the crop handles to select the area you want to keep",
        "Adjust the crop area by dragging the corners or edges",
        "Download the cropped image in your preferred format"
      ],
      "image-grayscale": [
        "Upload an image file to convert to grayscale",
        "The tool will automatically convert colors to grayscale",
        "Preview the grayscale version of your image",
        "Download the converted grayscale image"
      ],
      "image-format-converter": [
        "Upload an image in any supported format (JPG, PNG, etc.)",
        "Select the target format you want to convert to",
        "Choose quality settings if applicable",
        "Download the converted image in the new format"
      ],
      "image-to-base64": [
        "Upload an image file using the file input",
        "The tool will convert the image to Base64 encoding",
        "Copy the Base64 string from the output area",
        "Use the Base64 string in your code or data URI"
      ],
      "add-watermark": [
        "Upload the main image you want to watermark",
        "Add text or upload a logo for the watermark",
        "Position and adjust the watermark opacity and size",
        "Download the watermarked image"
      ],
      "meme-generator": [
        "Upload an image or choose from templates",
        "Add your meme text in the top and bottom text fields",
        "Customize font, size, and color of the text",
        "Download your completed meme image"
      ],

      // SEO Tools
      "meta-tag-generator": [
        "Enter your website title and description",
        "Add keywords and other SEO information",
        "The tool will generate proper meta tags",
        "Copy the generated HTML meta tags to your website"
      ],
      "robots-txt-generator": [
        "Configure which pages search engines can crawl",
        "Set rules for different user agents if needed",
        "Add sitemap location and other directives",
        "Copy the generated robots.txt content to your website root"
      ],
      "og-meta-generator": [
        "Enter your page title, description, and image URL",
        "Add social media specific information",
        "Preview how your content will appear when shared",
        "Copy the Open Graph meta tags to your HTML"
      ],
      "canonical-url-generator": [
        "Enter the URL you want to make canonical",
        "The tool will generate the proper canonical tag",
        "Copy the canonical URL tag to your HTML head",
        "Use this to prevent duplicate content issues"
      ],
      "xml-sitemap-generator": [
        "Enter your website URLs and their priorities",
        "Set change frequencies for each page",
        "Add last modification dates if known",
        "Download the XML sitemap file for your website"
      ],
      "keyword-density-checker": [
        "Paste your content text in the input area",
        "Enter the keywords you want to analyze",
        "Click 'Analyze' to check keyword density",
        "Review the results and optimize your content accordingly"
      ],
      "page-speed-test": [
        "Enter your website URL in the input field",
        "Click 'Test Speed' to analyze your page",
        "Review the performance metrics and suggestions",
        "Use the recommendations to improve your site speed"
      ],
      "google-serp-simulator": [
        "Enter your page title and meta description",
        "Add your target keyword for the search",
        "Preview how your page will appear in Google search results",
        "Optimize your content based on the preview"
      ],

      // Calculators
      "percentage-calculator": [
        "Enter the original value and percentage",
        "Choose calculation type (percentage of, percentage change, etc.)",
        "Click 'Calculate' to get the result",
        "Use the result for your calculations"
      ],
      "loan-calculator": [
        "Enter the loan amount you want to borrow",
        "Set the interest rate and loan term in years",
        "Choose payment frequency (monthly, yearly, etc.)",
        "View your monthly payment and total interest"
      ],
      "bmi-calculator": [
        "Enter your height in feet/inches or centimeters",
        "Enter your weight in pounds or kilograms",
        "Select your gender and age if required",
        "View your BMI category and health recommendations"
      ],
      "tip-calculator": [
        "Enter the bill amount before tip",
        "Select the tip percentage or enter a custom amount",
        "Add number of people to split the bill",
        "View the tip amount and total per person"
      ],
      "discount-calculator": [
        "Enter the original price of the item",
        "Set the discount percentage or amount",
        "Click 'Calculate' to see the savings",
        "View the final price after discount"
      ],
      "mortgage-calculator": [
        "Enter the home price and down payment amount",
        "Set the interest rate and loan term",
        "Add property taxes and insurance if applicable",
        "View your monthly mortgage payment breakdown"
      ],
      "compound-interest-calculator": [
        "Enter your initial investment amount",
        "Set the annual interest rate and time period",
        "Choose compounding frequency (monthly, yearly, etc.)",
        "View your investment growth over time"
      ],
      "roi-calculator": [
        "Enter your initial investment amount",
        "Add the current or final value of your investment",
        "Set the time period for the investment",
        "View your return on investment percentage"
      ],
      "tax-calculator": [
        "Enter your annual income",
        "Select your filing status and state",
        "Add deductions and credits if applicable",
        "View your estimated tax liability and refund"
      ],
      "fuel-cost-calculator": [
        "Enter your trip distance in miles or kilometers",
        "Set your vehicle's fuel efficiency (MPG or L/100km)",
        "Enter the current fuel price per gallon/liter",
        "View your total fuel cost for the trip"
      ],
      "gpa-calculator": [
        "Enter your course grades and credit hours",
        "Select the grading scale (4.0, 5.0, etc.)",
        "Add all your courses for the semester",
        "View your calculated GPA"
      ],
      "calorie-calculator": [
        "Enter your age, height, weight, and activity level",
        "Select your gender and fitness goals",
        "Choose your activity level from the options",
        "View your daily calorie needs for maintenance or weight loss"
      ],
      "currency-converter": [
        "Select the currency you want to convert from",
        "Choose the target currency you want to convert to",
        "Enter the amount you want to convert",
        "View the converted amount with current exchange rates"
      ],
      "unit-converter": [
        "Select the type of unit (length, weight, temperature, etc.)",
        "Choose the unit you want to convert from",
        "Select the target unit you want to convert to",
        "Enter the value and view the converted result"
      ],

      // Number Tools
      "random-number": [
        "Set the minimum and maximum values for your range",
        "Choose how many random numbers you want to generate",
        "Click 'Generate' to create random numbers",
        "Use the numbers for games, sampling, or other purposes"
      ],
      "prime-number-checker": [
        "Enter the number you want to check",
        "Click 'Check' to determine if it's prime",
        "View the result and any factors if it's not prime",
        "Use this for mathematical calculations or learning"
      ],
      "lcm-gcd-calculator": [
        "Enter two or more numbers separated by commas",
        "Click 'Calculate' to find LCM and GCD",
        "View the least common multiple and greatest common divisor",
        "Use the results for mathematical problems"
      ],
      "roman-to-number": [
        "Enter a Roman numeral (e.g., XIV, MCMXC)",
        "Click 'Convert' to get the decimal equivalent",
        "View the converted number in standard decimal format",
        "Use the result for historical or mathematical purposes"
      ],
      "number-to-roman": [
        "Enter a decimal number (1-3999)",
        "Click 'Convert' to get the Roman numeral",
        "View the Roman numeral representation",
        "Use the Roman numeral for historical or educational purposes"
      ],
      "binary-to-decimal": [
        "Enter a binary number (using only 0s and 1s)",
        "Click 'Convert' to get the decimal equivalent",
        "View the converted decimal number",
        "Use the result for programming or mathematical calculations"
      ],
      "decimal-to-binary": [
        "Enter a decimal number",
        "Click 'Convert' to get the binary representation",
        "View the binary number (using 0s and 1s)",
        "Use the binary number for programming or computer science"
      ],
      "hex-to-decimal": [
        "Enter a hexadecimal number (using 0-9 and A-F)",
        "Click 'Convert' to get the decimal equivalent",
        "View the converted decimal number",
        "Use the result for programming or color calculations"
      ],
      "decimal-to-hex": [
        "Enter a decimal number",
        "Click 'Convert' to get the hexadecimal representation",
        "View the hexadecimal number (using 0-9 and A-F)",
        "Use the hex number for programming or color codes"
      ],

      // Random Generators
      "random-name-picker": [
        "Enter a list of names separated by commas or line breaks",
        "Click 'Pick Random Name' to select one",
        "View the randomly selected name",
        "Use this for games, contests, or decision making"
      ],
      "password-generator": [
        "Set the desired password length",
        "Choose character types (uppercase, lowercase, numbers, symbols)",
        "Click 'Generate Password' to create a secure password",
        "Copy the generated password for your accounts"
      ],
      "uuid-generator": [
        "Click 'Generate UUID' to create a new unique identifier",
        "Choose the UUID version if multiple options are available",
        "Copy the generated UUID for your applications",
        "Use UUIDs for unique identifiers in databases or APIs"
      ],
      "dice-roller": [
        "Select the number of dice you want to roll",
        "Choose the number of sides on each die (6, 10, 20, etc.)",
        "Click 'Roll Dice' to simulate the roll",
        "View the results and total for your game"
      ],
      "username-generator": [
        "Enter keywords or themes for your username",
        "Choose username length and style preferences",
        "Click 'Generate' to create username suggestions",
        "Select and copy a username you like"
      ],
      "business-name-generator": [
        "Enter keywords related to your business",
        "Select industry or business type if available",
        "Click 'Generate' to create business name ideas",
        "Choose and register a name that fits your brand"
      ],
      "hashtag-generator": [
        "Enter keywords or describe your content",
        "Select the platform (Instagram, Twitter, etc.)",
        "Click 'Generate' to create relevant hashtags",
        "Copy the hashtags to use in your social media posts"
      ],
      "random-yes-no": [
        "Think of your question or decision",
        "Click 'Get Answer' to receive a random yes or no",
        "View the random response",
        "Use this for fun decision making or games"
      ],
      "coin-flip": [
        "Think of your decision or question",
        "Click 'Flip Coin' to simulate a coin toss",
        "View whether it landed on heads or tails",
        "Use the result to make your decision"
      ],
      "fortune-cookie": [
        "Click 'Get Fortune' to receive a random fortune message",
        "Read your fortune and enjoy the wisdom or humor",
        "Share the fortune with friends if you like",
        "Use this for entertainment or inspiration"
      ],
      "magic-8-ball": [
        "Think of a yes/no question in your mind",
        "Click 'Ask the 8-Ball' to get a mysterious answer",
        "Read the cryptic response to your question",
        "Use this for fun decision making or entertainment"
      ],

      // Social Media Tools
      "twitter-character-counter": [
        "Type your tweet in the text area",
        "View the character count in real-time",
        "See how your tweet will appear in the preview",
        "Adjust your text to fit within the 280 character limit"
      ],
      "facebook-post-preview": [
        "Enter your post text and add an image URL if desired",
        "View how your post will appear on Facebook",
        "Check the formatting and appearance",
        "Copy the content to post on Facebook"
      ],
      "hashtag-counter": [
        "Paste your social media post content",
        "The tool will count and analyze your hashtags",
        "View hashtag usage statistics and suggestions",
        "Optimize your hashtag strategy based on the results"
      ],
      "youtube-title-generator": [
        "Enter your video topic or keywords",
        "Select the type of content (tutorial, review, etc.)",
        "Click 'Generate' to create title suggestions",
        "Choose and copy a compelling title for your video"
      ],

      // Developer Tools
      "html-minifier": [
        "Paste your HTML code in the input area",
        "Choose minification options (remove comments, whitespace, etc.)",
        "Click 'Minify' to compress your HTML",
        "Copy the minified code to reduce file size"
      ],
      "css-minifier": [
        "Paste your CSS code in the input area",
        "Select compression options for optimal results",
        "Click 'Minify' to compress your CSS",
        "Copy the minified CSS to improve page load speed"
      ],
      "js-minifier": [
        "Paste your JavaScript code in the input area",
        "Choose minification settings for your needs",
        "Click 'Minify' to compress your JavaScript",
        "Copy the minified code for production use"
      ],
      "json-formatter": [
        "Paste your JSON data in the input area",
        "Click 'Format' to beautify and validate the JSON",
        "View the formatted JSON with proper indentation",
        "Copy the formatted JSON or download as a file"
      ],
      "html-encoder": [
        "Enter the text you want to encode",
        "Click 'Encode' to convert to HTML entities",
        "View the encoded HTML entities",
        "Copy the encoded text for use in HTML"
      ],
      "gradient-generator": [
        "Choose your starting and ending colors",
        "Select gradient direction and type",
        "Preview the gradient in real-time",
        "Copy the CSS code for your website"
      ],
      "box-shadow-generator": [
        "Adjust shadow properties using the sliders",
        "Preview the shadow effect in real-time",
        "Fine-tune the shadow appearance",
        "Copy the CSS box-shadow code"
      ],
      "html-table-generator": [
        "Set the number of rows and columns",
        "Add table headers and content",
        "Choose table styling options",
        "Copy the generated HTML table code"
      ],
      "border-radius-generator": [
        "Adjust the corner radius using sliders",
        "Preview the border radius effect",
        "Set different radius for each corner if needed",
        "Copy the CSS border-radius code"
      ],
      "bootstrap-button-generator": [
        "Choose button style and size",
        "Select colors and effects",
        "Add text and icons if desired",
        "Copy the Bootstrap button HTML and CSS"
      ],
      "js-obfuscator": [
        "Paste your JavaScript code in the input area",
        "Configure obfuscation settings for security",
        "Click 'Obfuscate' to protect your code",
        "Copy the obfuscated code for production"
      ],
      "regex-tester": [
        "Enter your regular expression pattern",
        "Add test strings to match against",
        "View matches and capture groups in real-time",
        "Use this to test and debug your regex patterns"
      ],
      "base64-encoder": [
        "Enter text or upload a file to encode",
        "Click 'Encode' to convert to Base64",
        "View the Base64 encoded string",
        "Copy the encoded data for your application"
      ],
      "jwt-decoder": [
        "Paste your JWT token in the input field",
        "Click 'Decode' to parse the token",
        "View the header, payload, and signature",
        "Use this to debug and understand JWT tokens"
      ],

      // Date & Time Tools
      "time-zone-converter": [
        "Select the source time zone",
        "Choose the destination time zone",
        "Enter the date and time to convert",
        "View the converted time in the target timezone"
      ],
      "stopwatch-timer": [
        "Click 'Start' to begin the stopwatch",
        "Use 'Pause' to temporarily stop timing",
        "Click 'Reset' to clear the timer",
        "Track elapsed time for your activities"
      ],
      "age-calculator": [
        "Enter your birth date",
        "The tool will calculate your current age",
        "View your age in years, months, and days",
        "Use this for age verification or calculations"
      ],
      "date-calculator": [
        "Enter the start and end dates",
        "Choose what to calculate (days, weeks, months, etc.)",
        "Click 'Calculate' to get the difference",
        "View the time difference between the dates"
      ],
      "timestamp-converter": [
        "Enter a Unix timestamp or date",
        "Choose the input and output formats",
        "Click 'Convert' to transform the timestamp",
        "View the converted date and time"
      ],
      "world-clock": [
        "Select cities from different time zones",
        "View current times around the world",
        "Compare times across multiple locations",
        "Use this for international scheduling"
      ],
      "countdown-timer": [
        "Set the target date and time for your countdown",
        "Choose display format (days, hours, minutes, seconds)",
        "View the countdown in real-time",
        "Use this for events, deadlines, or special occasions"
      ],
      "sleep-cycle-calculator": [
        "Enter your desired wake-up time",
        "The tool will calculate optimal sleep times",
        "View recommended bedtimes for different sleep cycles",
        "Plan your sleep schedule for better rest"
      ],

      // Security Tools
      "secure-password-generator": [
        "Set password length and complexity requirements",
        "Choose character types and special requirements",
        "Click 'Generate' to create a secure password",
        "Copy the password and store it safely"
      ],
      "hash-generator": [
        "Enter text or upload a file to hash",
        "Select hash algorithm (MD5, SHA-1, SHA-256, etc.)",
        "Click 'Generate' to create the hash",
        "Copy the hash for verification or security purposes"
      ],
      "email-validator": [
        "Enter the email address you want to validate",
        "Click 'Validate' to check the email format",
        "View validation results and suggestions",
        "Use this to verify email addresses before sending"
      ],
      "fake-name-generator": [
        "Select gender and nationality preferences",
        "Choose name format and style",
        "Click 'Generate' to create fake names",
        "Use generated names for testing or privacy"
      ],
      "url-safety-checker": [
        "Enter the URL you want to check",
        "Click 'Check Safety' to analyze the URL",
        "View safety report and potential threats",
        "Use this to verify URLs before clicking"
      ],

      // Media Tools
      "youtube-thumbnail-downloader": [
        "Enter the YouTube video URL",
        "Click 'Get Thumbnails' to fetch available images",
        "Choose from different thumbnail sizes and qualities",
        "Download the thumbnail image to your device"
      ],
      "voice-recorder": [
        "Click 'Start Recording' to begin voice capture",
        "Speak into your device's microphone",
        "Click 'Stop Recording' when finished",
        "Play back the recording or download the audio file"
      ],
      "mp3-to-wav-converter": [
        "Upload an MP3 audio file",
        "Choose output quality settings",
        "Click 'Convert' to transform the file",
        "Download the converted WAV file"
      ],
      "audio-cutter": [
        "Upload an audio file in supported format",
        "Use the timeline to select start and end points",
        "Preview the selected audio segment",
        "Download the trimmed audio file"
      ],
      "video-cutter": [
        "Upload a video file to trim",
        "Set the start and end times for your clip",
        "Preview the trimmed video segment",
        "Download the cut video file"
      ],
      "remove-audio-from-video": [
        "Upload a video file with audio",
        "Click 'Remove Audio' to strip the sound track",
        "Preview the video without audio",
        "Download the silent video file"
      ],

      // Additional tools
      "youtube-thumbnail": [
        "Enter the YouTube video URL",
        "Click 'Get Thumbnails' to fetch available images",
        "Choose from different thumbnail sizes and qualities",
        "Download the thumbnail image to your device"
      ],
      "mp3-to-wav": [
        "Upload an MP3 audio file",
        "Choose output quality settings",
        "Click 'Convert' to transform the file",
        "Download the converted WAV file"
      ],
      "url-encoder": [
        "Enter the URL or text you want to encode",
        "Click 'Encode' to convert to URL-encoded format",
        "View the encoded URL in the output area",
        "Copy the encoded URL for use in web applications"
      ],
      "qr-generator": [
        "Enter the text or URL you want to encode in QR code",
        "Choose QR code size and error correction level",
        "Click 'Generate QR Code' to create the code",
        "Download the QR code image or copy it to your clipboard"
      ],
      "color-picker": [
        "Click on the color picker to select a color",
        "Use the color wheel or sliders to fine-tune your selection",
        "View the color in different formats (HEX, RGB, HSL)",
        "Copy the color code for use in your projects"
      ],
      "binary-converter": [
        "Enter a number in any supported format (binary, decimal, hex, octal)",
        "Select the input format and target format",
        "Click 'Convert' to transform the number",
        "View and copy the converted number in the desired format"
      ]
    };

    return instructions[toolId] || [
      "Enter your content in the input area",
      "Configure any available options or settings",
      "Click the process or convert button",
      "Copy or download your results"
    ];
  };

  const renderToolComponent = () => {
    switch (toolId) {
      case "case-converter":
        return <CaseConverter />;
      case "word-counter":
        return <WordCounter />;
      case "text-diff":
        return <TextDiff />;
      case "lorem-ipsum":
        return <LoremIpsum />;
      case "markdown-preview":
        return <MarkdownPreview />;
      case "json-formatter":
        return <JsonFormatter />;
      case "base64-encoder":
        return <Base64Encoder />;
      case "unit-converter":
        return <UnitConverter />;
      case "timestamp-converter":
        return <TimestampConverter />;
      case "uuid-generator":
        return <UuidGenerator />;
      case "password-generator":
        return <PasswordGenerator />;
      case "qr-generator":
        return <QrGenerator />;
      case "random-number":
        return <RandomNumber />;
      case "percentage-calculator":
        return <PercentageCalculator />;
      case "date-calculator":
        return <DateCalculator />;
      case "loan-calculator":
        return <LoanCalculator />;
      case "url-encoder":
        return <UrlEncoder />;
      case "html-encoder":
        return <HtmlEncoder />;
      case "regex-tester":
        return <RegexTester />;
      case "image-resizer":
        return <ImageResizer />;
      case "color-picker":
        return <ColorPicker />;
      case "hash-generator":
        return <HashGenerator />;
      case "binary-converter":
        return <BinaryConverter />;
      case "css-minifier":
        return <CssMinifier />;
      case "js-minifier":
        return <JsMinifier />;
      case "bmi-calculator":
        return <BmiCalculator />;
      case "age-calculator":
        return <AgeCalculator />;
      case "string-reverser":
        return <StringReverser />;
      case "whitespace-remover":
        return <WhitespaceRemover />;
      case "duplicate-remover":
        return <DuplicateRemover />;
      case "sort-lines":
        return <SortLines />;
      case "image-to-base64":
        return <ImageToBase64 />;
      case "gradient-generator":
        return <GradientGenerator />;
      case "jwt-decoder":
        return <JwtDecoder />;
      case "text-to-slug":
        return <TextToSlug />;
      case "character-counter":
        return <CharacterCounter />;
      case "random-name-picker":
        return <RandomNamePicker />;
      case "dice-roller":
        return <DiceRoller />;
      case "coin-flip":
        return <CoinFlip />;
      case "random-yes-no":
        return <RandomYesNo />;
      case "prime-number-checker":
        return <PrimeNumberChecker />;
      case "text-to-binary":
        return <TextToBinary />;
      case "binary-to-text":
        return <BinaryToText />;
      case "email-validator":
        return <EmailValidator />;
      case "ascii-art-generator":
        return <AsciiArtGenerator />;
      case "random-word-generator":
        return <RandomWordGenerator />;
      case "text-to-speech":
        return <TextToSpeech />;
      case "speech-to-text":
        return <SpeechToText />;
      case "tip-calculator":
        return <TipCalculator />;
      case "discount-calculator":
        return <DiscountCalculator />;
      case "mortgage-calculator":
        return <MortgageCalculator />;
      case "lcm-gcd-calculator":
        return <LcmGcdCalculator />;
      case "roman-to-number":
        return <RomanToNumber />;
      case "number-to-roman":
        return <RomanToNumber />;
      case "username-generator":
        return <UsernameGenerator />;
      case "business-name-generator":
        return <BusinessNameGenerator />;
      case "html-minifier":
        return <HtmlMinifier />;
      case "compound-interest-calculator":
        return <CompoundInterestCalculator />;
      case "currency-converter":
        return <CurrencyConverter />;
      case "meta-tag-generator":
        return <MetaTagGenerator />;
      case "image-cropper":
        return <ImageCropper />;
      case "image-grayscale":
        return <ImageGrayscale />;
      case "twitter-character-counter":
        return <TwitterCharacterCounter />;
      case "youtube-title-generator":
        return <YouTubeTitleGenerator />;
      case "time-zone-converter":
        return <TimeZoneConverter />;
      case "secure-password-generator":
        return <SecurePasswordGenerator />;
      case "voice-recorder":
        return <VoiceRecorder />;
      case "image-format-converter":
        return <ImageFormatConverter />;
      case "add-watermark":
        return <AddWatermark />;
      case "roi-calculator":
        return <RoiCalculator />;
      case "tax-calculator":
        return <TaxCalculator />;
      case "hashtag-generator":
        return <HashtagGenerator />;
      case "fortune-cookie":
        return <FortuneCookie />;
      case "fuel-cost-calculator":
        return <FuelCostCalculator />;
      case "gpa-calculator":
        return <GpaCalculator />;
      case "calorie-calculator":
        return <CalorieCalculator />;
      case "binary-to-decimal":
        return <BinaryToDecimalConverter />;
      case "decimal-to-binary":
        return <DecimalToBinaryConverter />;
      case "box-shadow-generator":
        return <BoxShadowGenerator />;
      case "hex-to-decimal":
        return <HexToDecimalConverter />;
      case "decimal-to-hex":
        return <DecimalToHexConverter />;
      case "magic-8-ball":
        return <Magic8Ball />;
      case "html-table-generator":
        return <HtmlTableGenerator />;
      case "border-radius-generator":
        return <BorderRadiusGenerator />;
      case "bootstrap-button-generator":
        return <BootstrapButtonGenerator />;
      case "stopwatch-timer":
        return <StopwatchTimer />;
      case "world-clock":
        return <WorldClock />;
      case "meme-generator":
        return <MemeGenerator />;
      case "robots-txt-generator":
        return <RobotsTxtGenerator />;
      case "og-meta-generator":
        return <OgMetaGenerator />;
      case "canonical-url-generator":
        return <CanonicalUrlGenerator />;
      case "xml-sitemap-generator":
        return <XmlSitemapGenerator />;
      case "keyword-density-checker":
        return <KeywordDensityChecker />;
      case "page-speed-test":
        return <PageSpeedTest />;
      case "google-serp-simulator":
        return <GoogleSerpSimulator />;
      case "facebook-post-preview":
        return <FacebookPostPreview />;
      case "hashtag-counter":
        return <HashtagCounter />;
      case "javascript-obfuscator":
        return <JavaScriptObfuscator />;
      case "countdown-timer":
        return <CountdownTimer />;
      case "sleep-cycle-calculator":
        return <SleepCycleCalculator />;
      case "fake-name-generator":
        return <FakeNameGenerator />;
      case "url-safety-checker":
        return <UrlSafetyChecker />;
      case "youtube-thumbnail-downloader":
        return <YouTubeThumbnailDownloader />;
      case "mp3-to-wav-converter":
        return <Mp3ToWavConverter />;
      case "audio-cutter":
        return <AudioCutter />;
      case "video-cutter":
        return <VideoCutter />;
      case "remove-audio-from-video":
        return <RemoveAudioFromVideo />;
      default:
        return (
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle>Tool Interface</CardTitle>
            </CardHeader>
            <CardContent className="min-h-[400px]">
              <div className="flex h-full items-center justify-center rounded-lg border-2 border-dashed bg-muted/20 p-12">
                <div className="text-center">
                  <IconComponent className="mx-auto mb-4 h-16 w-16 text-muted-foreground" />
                  <p className="text-lg font-medium text-muted-foreground">
                    Tool functionality coming soon
                  </p>
                  <p className="mt-2 text-sm text-muted-foreground">
                    This tool is under development
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        );
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <section className="bg-gradient-to-br from-primary/5 via-accent/5 to-background py-12">
        <div className="container">
          <Breadcrumb className="mb-6">
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink asChild>
                  <Link to="/">Home</Link>
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbLink asChild>
                  <Link to={`/${category.id}`} className="flex items-center gap-2">
                    <CategoryIconComponent className="h-4 w-4" />
                    {category.name}
                  </Link>
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>{tool.name}</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>

          <div className="flex flex-col gap-6 lg:flex-row lg:items-start">
            <div className="flex-1">
              <div className="mb-4 flex items-center gap-4">
                <div className="rounded-xl bg-gradient-to-br from-primary/10 to-accent/10 p-4">
                  <IconComponent className="h-10 w-10 text-primary" />
                </div>
                <div>
                  <div className="mb-2 flex items-center gap-2">
                    <h1 className="text-4xl font-bold">{tool.name}</h1>
                    {tool.isNew && <Badge className="bg-accent text-accent-foreground">New</Badge>}
                    {tool.isPopular && <Badge variant="secondary">Popular</Badge>}
                  </div>
                  <p className="text-lg text-muted-foreground">{tool.description}</p>
                </div>
              </div>
            </div>

            <Button className="gap-2" size="lg">
              <Star className="h-4 w-4" />
              Add to Favorites
            </Button>
          </div>
        </div>
      </section>

      <section className="py-12">
        <div className="container">
          {renderToolComponent()}

          {/* AdSense - After Tool */}
          <AdSense slot="4540396335" />

          <div className="mt-8 grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>How to Use</CardTitle>
              </CardHeader>
              <CardContent>
                <ol className="space-y-3 text-sm text-muted-foreground">
                  {getToolInstructions(toolId).map((instruction, index) => (
                    <li key={index} className="flex gap-3">
                      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
                        {index + 1}
                      </span>
                      <span>{instruction}</span>
                    </li>
                  ))}
                </ol>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Features</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li className="flex items-center gap-2">
                    <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                    Free to use, no registration required
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                    Fast and efficient processing
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                    Works completely in your browser
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                    Your data never leaves your device
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                    Mobile-friendly interface
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>
    </div>
  );
};

export default ToolPage;
