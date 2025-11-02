import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Cookie, RotateCcw, Sparkles } from "lucide-react";

export const FortuneCookie = () => {
  const [fortune, setFortune] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);

  const fortunes = [
    "A beautiful, smart, and loving person will be coming into your life.",
    "A dubious friend may be an enemy in camouflage.",
    "A faithful friend is a strong defense.",
    "A feather in the hand is better than a bird in the air.",
    "A fresh start will put you on your way.",
    "A friend asks only for your time, not your money.",
    "A friend is a present you give yourself.",
    "A gambler not only will lose what he has, but also will lose what he doesn't have.",
    "A golden egg of opportunity falls into your lap this month.",
    "A good friendship is often more important than a passionate romance.",
    "A good time to finish up old tasks.",
    "A hunch is creativity trying to tell you something.",
    "A lifetime of happiness lies ahead of you.",
    "A light heart carries you through all the hard times.",
    "A new perspective will come with the new year.",
    "A person is never too old to learn.",
    "A person of words and not deeds is like a garden full of weeds.",
    "A pleasant surprise is waiting for you.",
    "A short pencil is usually better than a long memory any day.",
    "A small donation is call for. It's the thought that counts.",
    "A smile is your personal welcome mat.",
    "A smooth long journey! Great expectations.",
    "A soft voice may be awfully persuasive.",
    "A truly rich life contains love and art in abundance.",
    "Accept something that you cannot change, and you will feel better.",
    "Adventure can be real happiness.",
    "Advice is like kissing. It costs nothing and is a pleasant thing to do.",
    "All the effort you are making will ultimately pay off.",
    "All the troubles you have will pass away very quickly.",
    "All will go well with your new project.",
    "All your hard work will soon pay off.",
    "Allow compassion to guide your decisions.",
    "An acquaintance of the past will affect you in the near future.",
    "An agreeable romance might begin to take on the appearance.",
    "An important person will offer you support.",
    "An inch of time is an inch of gold.",
    "Any decision you have to make tomorrow is a good decision.",
    "At the touch of love, everyone becomes a poet.",
    "Be careful or you could fall for some tricks today.",
    "Beauty in its various forms appeals to you.",
    "Because you demand more from yourself, others respect you more.",
    "Believe in yourself and others will too.",
    "Believe it can be done.",
    "Better ask twice than lose yourself once.",
    "Carve your name on your heart and not on marble.",
    "Change is happening in your life, so go with the flow!",
    "Competence like yours is underrated.",
    "Congratulations! You are on your way.",
    "Could I get some directions to your heart?",
    "Courtesy begins in the home.",
    "Curiosity kills boredom. Nothing can kill curiosity.",
    "Dedicate yourself with a calm mind to the task at hand.",
    "Depart not from the path which fate has you assigned.",
    "Determination is what you need now.",
    "Disbelief destroys the magic.",
    "Distance yourself from the vain.",
    "Do not be intimidated by the eloquence of others.",
    "Do not let ambitions overshadow small success.",
    "Do not make extra work for yourself.",
    "Do not underestimate yourself. Human beings have unlimited potentials.",
    "Don't be discouraged, because every wrong attempt discarded is another step forward.",
    "Don't just spend time. Invest it.",
    "Don't just think, act!",
    "Don't worry; prosperity will knock on your door soon.",
    "Each day, compel yourself to do something you would rather not do.",
    "Education is the ability to meet life's situations.",
    "Embrace the love surrounding you.",
    "Emulate what you admire in your parents.",
    "Emulate what you respect in your friends.",
    "Every flower blooms in its own sweet time.",
    "Every wise man started out by asking many questions.",
    "Everyday in your life is a special occasion.",
    "Everywhere you choose to go, friendly faces will greet you.",
    "Failure is the chance to do better next time.",
    "Feeding a cow with roses does not get extra appreciation.",
    "For hate is never conquered by hate. Hate is conquered by love.",
    "Fortune Not Found: Abort, Retry, Ignore?",
    "From now on your kindness will lead you to success.",
    "Get your mind set – confidence will lead you on.",
    "Go for the gold today! You'll be the champion of whatever.",
    "Go take a rest; you deserve it.",
    "Good news will be brought to you by mail.",
    "Good news will come to you by mail.",
    "Good to begin well, better to end well.",
    "Happiness begins with facing life with a smile and a wink.",
    "Happiness will bring you good luck.",
    "Happy life is just in front of you.",
    "Hard words break no bones, fine words butter no parsnips.",
    "Have a beautiful day.",
    "He who knows he has enough is rich.",
    "Help! I'm being held prisoner in a fortune cookie factory!",
    "How many of you believe in psycho-kinesis? Raise my hand.",
    "How you look depends on where you go.",
    "I learn by going where I have to go.",
    "If a true sense of value is to be yours it must come through service.",
    "If certainty were truth, we would never be wrong.",
    "If you continually give, you will continually have.",
    "If you look in the right places, you can find some good offerings.",
    "If you think you can do a thing or think you can't do a thing, you're right.",
    "If your desires are not extravagant, they will be granted.",
    "If your happiness depends on money, you will never be happy with yourself.",
    "Imagination rules the world.",
    "In order to take, one must first give.",
    "In the end all things will be known.",
    "It could be better, but it's good enough.",
    "It is better to be an optimist and proven a fool than to be a pessimist and be proven right.",
    "It is better to deal with problems before they arise.",
    "It is honorable to stand up for what is right, however unpopular it seems.",
    "It is worth reviewing some old lessons.",
    "It takes courage to admit fault.",
    "It's time to get moving. Your spirits will lift accordingly.",
    "It's time to use your intuition to obtain answers you are seeking.",
    "It's better to be alone sometimes.",
    "It's never too late to reach for the stars.",
    "It's time to get moving. Your spirits will lift accordingly.",
    "Keep your face to the sunshine and you will never see shadows.",
    "Let the world be filled with tranquility and goodwill.",
    "Like the river flow into the sea. Something are just meant to be.",
    "Listen not to vain words of empty tongue.",
    "Live free or die.",
    "Look for new outlets for your own creative abilities.",
    "Love is like a friendship caught on fire.",
    "Love is the only force capable of transforming an enemy into a friend.",
    "Love is the only force capable of transforming an enemy into a friend.",
    "Love lights up the world.",
    "Love truth, but pardon error.",
    "Man is born to live and not to prepare to live.",
    "Man's mind, once stretched by a new idea, never regains its original dimensions.",
    "Many will travel to hear you speak.",
    "Meditation with an old enemy is recommended.",
    "Miles are covered one step at a time.",
    "Nature, time and patience are the three great physicians.",
    "Never fear! The end of something marks the start of something new.",
    "New ideas could be profitable.",
    "New people will bring you new realizations, especially about big issues.",
    "No one can walk backwards into the future.",
    "Nothing is more difficult, and therefore more precious, than to be able to decide.",
    "Now is a good time to buy stock. Especially in a manufacturing company.",
    "Now is the time to go ahead and pursue that idea you've had.",
    "Now is the time to try something new.",
    "Now is the time to try something new.",
    "Observe all men, but most of all yourself.",
    "One can never fill another's shoes, but rather must walk one's own path.",
    "One of the first things you should look for in a problem is its positive side.",
    "Others can help you now.",
    "Pennies from heaven find their way to your doorstep this year!",
    "People are naturally attracted to you.",
    "People find it difficult to resist your persuasive manner.",
    "Perhaps you've been focusing too much on saving.",
    "Pick battles big enough to matter, small enough to win.",
    "Plan for many pleasures ahead.",
    "Please visit us at www.wontonfood.com",
    "Practice makes perfect.",
    "Protective measures will prevent costly disasters.",
    "Put your mind into planning today. Look into the future.",
    "Remember to share good fortune as well as bad with your friends.",
    "Rest has a peaceful effect on your physical and emotional health.",
    "Resting well is as important as working hard.",
    "Romance moves you in a new direction.",
    "Savor your freedom – it is precious.",
    "Say hello to others. You will have a happier day.",
    "Self-knowledge is a life long process.",
    "Share your joys and sorrows with your family.",
    "Sift through your past to get a better idea of the present.",
    "Sloth makes all things difficult; industry all easy.",
    "Small confidences mark the onset of a friendship.",
    "Someone is looking up to you. Don't let that person down.",
    "Soon life will become more interesting.",
    "Success is a journey, not a destination.",
    "Success is failure turned inside out.",
    "Take the high road.",
    "The adventure of life is to learn. The purpose of life is to grow.",
    "The best is yet to come.",
    "The best prediction of future is the past.",
    "The change you started already have far-reaching effects. Be ready.",
    "The first man gets the oyster, the second man gets the shell.",
    "The greatest achievement in life is to stand up again after falling.",
    "The harder you work, the luckier you get.",
    "The night life is for you.",
    "The one that recognizes the illusion does not act as if it is real.",
    "The only people who never fail are those who never try.",
    "The person who will not stand for something will fall for anything.",
    "The philosophy of one century is the common sense of the next.",
    "The saints are the sinners who keep on trying.",
    "The secret to good friends is no secret to you.",
    "The small courtesies sweeten life, the greater ennoble it.",
    "The smart thing to do is to begin trusting your intuitions.",
    "The strong person understands how to withstand substantial loss.",
    "The sure way to predict the future is to invent it.",
    "The truly generous share, even with their enemies.",
    "The value lies not within any particular thing, but in the desire placed on that thing.",
    "The weather is wonderful.",
    "There is no mistake so great as that of being always right.",
    "There is no wisdom greater than kindness.",
    "There is not greater pleasure than seeing your loved ones prosper.",
    "There's no such thing as an ordinary cat.",
    "Things don't just happen; they happen just.",
    "Those who care will make the effort.",
    "Time and patience are called for many surprises await you!",
    "Time is precious, but truth is more precious than time.",
    "To be old and wise, you must first be young and stupid.",
    "To be successful, you must have your heart in your business.",
    "To be successful, you must have your heart in your business.",
    "To courageously shoulder the responsibility of one's mistake is character.",
    "Today is the conserve yourself – you'll need your energy.",
    "Today, your mouth might be moving but no one is listening.",
    "Tonight you will be blinded by passion.",
    "Use your abilities at this time to stay focused on your goal.",
    "Wealth awaits you very soon.",
    "Welcome change.",
    "What do you mean by that?",
    "What's hidden in an empty box?",
    "When in doubt, let your instincts guide you.",
    "When your heart is pure, your mind is clear.",
    "Wish you happiness.",
    "You always bring others happiness.",
    "You are a person of another time.",
    "You are admired by everyone for your talent and ability.",
    "You are almost there.",
    "You are busy, but you are happy.",
    "You are generous to an extreme and always think of the other fellow.",
    "You are going to have some new clothes.",
    "You are in good hands this evening.",
    "You are interested in higher education, whether material or spiritual.",
    "You are modest and courteous.",
    "You are never selfish with your advice or your help.",
    "You are next in line for promotion in your firm.",
    "You are offered the dream of a lifetime. Say yes!",
    "You are the master of every situation.",
    "You are the one who can make a difference.",
    "You are very expressive and positive in words, act and feeling.",
    "You are working hard.",
    "You can be a great leader, and good leadership qualities are being recognized by others.",
    "You can be trusted with responsibilities.",
    "You can keep a secret.",
    "You can see a lot just by looking.",
    "You can't love others until you love yourself.",
    "You desire recognition and you will find it.",
    "You have a deep appreciation of the arts and music.",
    "You have a deep interest in all that is artistic.",
    "You have a friendly heart and are well admired.",
    "You have a shrewd knack for spotting insincerity.",
    "You have a strong desire for a home and your family interests come first.",
    "You have a very appealing personality.",
    "You have an active mind and a keen imagination.",
    "You have an unusual equipment for success, use it properly.",
    "You have been selected for a secret mission.",
    "You have the power to write your own fortune.",
    "You have the tools to achieve whatever you desire.",
    "You have to learn to say no.",
    "You have unusual equipment for success, use it properly.",
    "You know where you are going and how to get there.",
    "You look pretty.",
    "You love challenge.",
    "You love Chinese food.",
    "You make people realize that there exist other beauties in the world.",
    "You make your own happiness.",
    "You never hesitate to tackle the most difficult problems.",
    "You only treasure what you lost.",
    "You seek to shield those you love and like the role of provider.",
    "You should be able to make money and hold on to it.",
    "You should be able to undertake and complete anything.",
    "You should pay for this check. Be generous enough to share a good fortune.",
    "You understand how to have fun with others and to enjoy your solitude.",
    "You will always be surrounded by true friends.",
    "You will always get what you want through your charm and personality.",
    "You will be called in to fulfill a position of high honor and responsibility.",
    "You will be fortunate in the opportunities presented to you.",
    "You will be given some recognition.",
    "You will be happy with your progress.",
    "You will be successful in your work.",
    "You will be traveling and coming into a fortune.",
    "You will be unusually successful in business.",
    "You will enjoy good health.",
    "You will enjoy good health; you will be surrounded by luxury.",
    "You will find great contentment in the daily, routine activities.",
    "You will have a fine capacity for the enjoyment of life.",
    "You will have gold pieces by the bushel.",
    "You will inherit some money or a small piece of land.",
    "You will make change for the better.",
    "You will never be in want.",
    "You will only be happy if you marry someone who is an outstanding person.",
    "You will overcome difficult times.",
    "You will soon be surrounded by good friends and laughter.",
    "You will take a chance in something in the near future.",
    "You will travel far and wide, both pleasure and business.",
    "You will travel far and wide, both pleasure and business.",
    "You will win success in whatever calling you adopt.",
    "You wish to see the best in people and you are not disappointed.",
    "You would make a great lawyer.",
    "Your ability for accomplishment will follow with success.",
    "Your ability is appreciated.",
    "Your biggest virtue is your modesty.",
    "Your character can be described as natural and unrestrained.",
    "Your difficulties will strengthen you.",
    "Your dreams are never silly; depend on them to guide you.",
    "Your dreams are worth your best efforts to achieve them.",
    "Your energy returns and you get things done.",
    "Your family is young, gifted and attractive.",
    "Your first love has never forgotten you.",
    "Your happiness is before you, not behind you! Cherish it.",
    "Your hard work will payoff today.",
    "Your heart will always make itself known through your words.",
    "Your home is the center of great love.",
    "Your ideals are well grounded. Carry them out.",
    "Your infinite capacity for patience will be rewarded sooner or later.",
    "Your leadership qualities will be tested and proven.",
    "Your life will be happy and peaceful.",
    "Your life will get more and more exciting.",
    "Your love life will be happy and harmonious.",
    "Your love of music will be an important part of your life.",
    "Your loyalty is a virtue, but not when it's wedded to blind stubbornness.",
    "Your mind is creative, original and alert.",
    "Your mind is your greatest asset.",
    "Your moods signal a period of change.",
    "Your quick witted cleverness contributes to your success.",
    "Your reputation is your wealth.",
    "Your success will astonish everyone.",
    "Your talents will be recognized and suitably rewarded.",
    "Your work interests can capture the highest status or prestige."
  ];

  const generateFortune = () => {
    setIsGenerating(true);
    
    setTimeout(() => {
      const randomIndex = Math.floor(Math.random() * fortunes.length);
      setFortune(fortunes[randomIndex]);
      setIsGenerating(false);
    }, 1000);
  };

  const clearFortune = () => {
    setFortune("");
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Fortune Cookie</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-2">
            <Button onClick={generateFortune} disabled={isGenerating} className="w-full sm:w-auto">
              <Cookie className="h-4 w-4 mr-2" />
              {isGenerating ? "Opening Fortune Cookie..." : "Open Fortune Cookie"}
            </Button>
            <Button onClick={clearFortune} variant="outline" className="w-full sm:w-auto">
              <RotateCcw className="h-4 w-4 mr-2" />
              Clear
            </Button>
          </div>
        </CardContent>
      </Card>

      {fortune && (
        <Card>
          <CardHeader>
            <CardTitle>Your Fortune</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="bg-gradient-to-br from-yellow-50 to-orange-50 border-2 border-yellow-200 rounded-lg p-4 sm:p-8 text-center">
              <div className="mb-4">
                <Sparkles className="h-8 w-8 sm:h-12 sm:w-12 mx-auto text-yellow-600 mb-4" />
              </div>
              <blockquote className="text-xl sm:text-2xl font-medium text-gray-800 italic leading-relaxed break-words px-2">
                "{fortune}"
              </blockquote>
              <div className="mt-6 text-xs sm:text-sm text-gray-600">
                — Fortune Cookie
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>About Fortune Cookies</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 text-sm text-muted-foreground">
            <p>
              Fortune cookies are crisp cookies usually made from flour, sugar, vanilla, and sesame seed oil with a piece of paper inside, a "fortune", on which is an aphorism, or a vague prophecy.
            </p>
            <p>
              The message inside may also include a Chinese phrase with translation and/or a list of lucky numbers used by some as lottery numbers.
            </p>
            <p>
              Fortune cookies are often served as a dessert in Chinese restaurants in the United States and other Western countries, but they are not found in China.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
