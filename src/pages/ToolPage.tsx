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
  const { toolId } = useParams();
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
                  <Link to={`/category/${category.id}`} className="flex items-center gap-2">
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
                  <li className="flex gap-3">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">1</span>
                    <span>Enter or paste your content in the input area</span>
                  </li>
                  <li className="flex gap-3">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">2</span>
                    <span>Configure any available options or settings</span>
                  </li>
                  <li className="flex gap-3">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">3</span>
                    <span>Click the process or convert button</span>
                  </li>
                  <li className="flex gap-3">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">4</span>
                    <span>Copy or download your results</span>
                  </li>
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
