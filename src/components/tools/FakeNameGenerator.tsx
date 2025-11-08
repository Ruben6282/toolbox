import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Copy, RotateCcw, Users, Shuffle, Download } from "lucide-react";
import { notify } from "@/lib/notify";

interface GeneratedName {
  firstName: string;
  lastName: string;
  email: string;
  username: string;
  phone: string;
  address: string;
  age: number;
  gender: string;
}

export const FakeNameGenerator = () => {
  const [gender, setGender] = useState("random");
  const [country, setCountry] = useState("us");
  const [count, setCount] = useState(5);
  const [generatedNames, setGeneratedNames] = useState<GeneratedName[]>([]);

  const nameData = {
    us: {
      male: {
        first: ["James", "John", "Robert", "Michael", "William", "David", "Richard", "Charles", "Joseph", "Thomas", "Christopher", "Daniel", "Paul", "Mark", "Donald", "George", "Kenneth", "Steven", "Edward", "Brian"],
        last: ["Smith", "Johnson", "Williams", "Brown", "Jones", "Garcia", "Miller", "Davis", "Rodriguez", "Martinez", "Hernandez", "Lopez", "Gonzalez", "Wilson", "Anderson", "Thomas", "Taylor", "Moore", "Jackson", "Martin"]
      },
      female: {
        first: ["Mary", "Patricia", "Jennifer", "Linda", "Elizabeth", "Barbara", "Susan", "Jessica", "Sarah", "Karen", "Nancy", "Lisa", "Betty", "Helen", "Sandra", "Donna", "Carol", "Ruth", "Sharon", "Michelle"],
        last: ["Smith", "Johnson", "Williams", "Brown", "Jones", "Garcia", "Miller", "Davis", "Rodriguez", "Martinez", "Hernandez", "Lopez", "Gonzalez", "Wilson", "Anderson", "Thomas", "Taylor", "Moore", "Jackson", "Martin"]
      }
    },
    uk: {
      male: {
        first: ["Oliver", "George", "Arthur", "Noah", "Muhammad", "Leo", "Oscar", "Harry", "Archie", "Jack", "Henry", "Charlie", "Freddie", "Theo", "Albie", "Joshua", "William", "James", "Lucas", "Alexander"],
        last: ["Smith", "Jones", "Taylor", "Williams", "Brown", "Davies", "Evans", "Wilson", "Thomas", "Roberts", "Johnson", "Lewis", "Walker", "Robinson", "Wood", "Thompson", "White", "Watson", "Jackson", "Wright"]
      },
      female: {
        first: ["Olivia", "Amelia", "Isla", "Ava", "Mia", "Grace", "Poppy", "Freya", "Florence", "Sophia", "Willow", "Emily", "Ella", "Charlotte", "Harper", "Luna", "Matilda", "Ivy", "Rosie", "Sienna"],
        last: ["Smith", "Jones", "Taylor", "Williams", "Brown", "Davies", "Evans", "Wilson", "Thomas", "Roberts", "Johnson", "Lewis", "Walker", "Robinson", "Wood", "Thompson", "White", "Watson", "Jackson", "Wright"]
      }
    },
    ca: {
      male: {
        first: ["Liam", "Noah", "Oliver", "William", "Elijah", "James", "Benjamin", "Lucas", "Henry", "Alexander", "Mason", "Michael", "Ethan", "Daniel", "Jacob", "Logan", "Jackson", "Levi", "Sebastian", "Mateo"],
        last: ["Smith", "Brown", "Tremblay", "Martin", "Roy", "Gagnon", "Lee", "Wilson", "Johnson", "MacDonald", "Taylor", "Campbell", "Anderson", "Jones", "Leblanc", "White", "Harris", "Clark", "Lewis", "Walker"]
      },
      female: {
        first: ["Emma", "Olivia", "Ava", "Isabella", "Sophia", "Charlotte", "Mia", "Amelia", "Harper", "Evelyn", "Abigail", "Emily", "Elizabeth", "Mila", "Ella", "Avery", "Sofia", "Camila", "Aria", "Scarlett"],
        last: ["Smith", "Brown", "Tremblay", "Martin", "Roy", "Gagnon", "Lee", "Wilson", "Johnson", "MacDonald", "Taylor", "Campbell", "Anderson", "Jones", "Leblanc", "White", "Harris", "Clark", "Lewis", "Walker"]
      }
    }
  };

  const generateRandomName = (): GeneratedName => {
    const selectedGender = gender === "random" ? (Math.random() > 0.5 ? "male" : "female") : gender;
    const countryData = nameData[country as keyof typeof nameData];
    const genderData = countryData[selectedGender as keyof typeof countryData];
    
    const firstName = genderData.first[Math.floor(Math.random() * genderData.first.length)];
    const lastName = genderData.last[Math.floor(Math.random() * genderData.last.length)];
    
    const email = `${firstName.toLowerCase()}.${lastName.toLowerCase()}@${getEmailDomain()}`;
    const username = `${firstName.toLowerCase()}${lastName.toLowerCase()}${Math.floor(Math.random() * 1000)}`;
    const phone = generatePhoneNumber();
    const address = generateAddress();
    const age = Math.floor(Math.random() * 60) + 18;
    
    return {
      firstName,
      lastName,
      email,
      username,
      phone,
      address,
      age,
      gender: selectedGender
    };
  };

  const getEmailDomain = () => {
    const domains = ["gmail.com", "yahoo.com", "hotmail.com", "outlook.com", "icloud.com"];
    return domains[Math.floor(Math.random() * domains.length)];
  };

  const generatePhoneNumber = () => {
    const areaCode = Math.floor(Math.random() * 900) + 100;
    const exchange = Math.floor(Math.random() * 900) + 100;
    const number = Math.floor(Math.random() * 9000) + 1000;
    return `(${areaCode}) ${exchange}-${number}`;
  };

  const generateAddress = () => {
    const streets = ["Main St", "Oak Ave", "Elm St", "Park Rd", "First St", "Second Ave", "Cedar Ln", "Maple Dr"];
    const street = streets[Math.floor(Math.random() * streets.length)];
    const number = Math.floor(Math.random() * 9999) + 1;
    return `${number} ${street}`;
  };

  const generateNames = () => {
    const names: GeneratedName[] = [];
    for (let i = 0; i < count; i++) {
      names.push(generateRandomName());
    }
    setGeneratedNames(names);
  notify.success(`${count} names generated!`);
  };

  const copyName = async (name: GeneratedName) => {
    const text = `${name.firstName} ${name.lastName}\n${name.email}\n${name.username}\n${name.phone}\n${name.address}\nAge: ${name.age}`;
    try {
      await navigator.clipboard.writeText(text);
  notify.success("Name copied to clipboard!");
    } catch (err) {
      console.error('Failed to copy: ', err);
    }
  };

  const copyAllNames = async () => {
    const text = generatedNames.map(name => 
      `${name.firstName} ${name.lastName} | ${name.email} | ${name.username} | ${name.phone} | ${name.address} | Age: ${name.age}`
    ).join('\n');
    
    try {
      await navigator.clipboard.writeText(text);
  notify.success("All names copied to clipboard!");
    } catch (err) {
      console.error('Failed to copy: ', err);
    }
  };

  const downloadNames = () => {
    const csvContent = "First Name,Last Name,Email,Username,Phone,Address,Age,Gender\n" +
      generatedNames.map(name => 
        `${name.firstName},${name.lastName},${name.email},${name.username},${name.phone},${name.address},${name.age},${name.gender}`
      ).join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'fake-names.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  notify.success("Names downloaded as CSV!");
  };

  const clearNames = () => {
    setGeneratedNames([]);
  };

  return (
  <div className="space-y-6 px-2 sm:px-0">
      <Card>
        <CardHeader>
          <CardTitle>Fake Name Generator</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="gender">Gender</Label>
              <Select value={gender} onValueChange={setGender}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="random">Random</SelectItem>
                  <SelectItem value="male">Male</SelectItem>
                  <SelectItem value="female">Female</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="country">Country</Label>
              <Select value={country} onValueChange={setCountry}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="us">United States</SelectItem>
                  <SelectItem value="uk">United Kingdom</SelectItem>
                  <SelectItem value="ca">Canada</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="count">Number of Names</Label>
              <Input
                id="count"
                type="number"
                min="1"
                max="50"
                value={count}
                onChange={(e) => setCount(parseInt(e.target.value) || 5)}
              />
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-2 w-full">
            <Button onClick={generateNames} className="flex items-center gap-2 w-full sm:w-auto">
              <Shuffle className="h-4 w-4" />
              Generate Names
            </Button>
            <Button onClick={clearNames} variant="outline" className="w-full sm:w-auto">
              <RotateCcw className="h-4 w-4 mr-2" />
              Clear
            </Button>
          </div>
        </CardContent>
      </Card>

      {generatedNames.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
              <span className="flex items-center gap-2 text-base sm:text-lg">
                <Users className="h-5 w-5" />
                Generated Names ({generatedNames.length})
              </span>
              <div className="flex flex-col xs:flex-row gap-2 w-full sm:w-auto">
                <Button onClick={copyAllNames} variant="outline" size="sm" className="w-full xs:w-auto">
                  <Copy className="h-4 w-4 mr-2" />
                  Copy All
                </Button>
                <Button onClick={downloadNames} variant="outline" size="sm" className="w-full xs:w-auto">
                  <Download className="h-4 w-4 mr-2" />
                  Download CSV
                </Button>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {generatedNames.map((name, index) => (
                <div key={index} className="border rounded-lg p-4">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                    <div className="flex-1 w-full">
                      <div className="flex flex-wrap items-center gap-2 mb-2">
                        <h3 className="text-base sm:text-lg font-semibold break-words">
                          {name.firstName} {name.lastName}
                        </h3>
                        <Badge variant="outline" className="text-xs sm:text-sm px-2 py-1">
                          {name.gender}
                        </Badge>
                        <Badge variant="outline" className="text-xs sm:text-sm px-2 py-1">
                          Age: {name.age}
                        </Badge>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs sm:text-sm break-words">
                        <div className="break-all"><strong>Email:</strong> {name.email}</div>
                        <div className="break-all"><strong>Username:</strong> {name.username}</div>
                        <div className="break-all"><strong>Phone:</strong> {name.phone}</div>
                        <div className="break-all"><strong>Address:</strong> {name.address}</div>
                      </div>
                    </div>
                    <Button 
                      onClick={() => copyName(name)} 
                      variant="outline" 
                      size="sm"
                      className="mt-2 sm:mt-0 w-full sm:w-auto"
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Use Cases</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs sm:text-sm">
            <div>
              <h4 className="font-semibold mb-2">Development & Testing:</h4>
              <ul className="space-y-1 text-muted-foreground">
                <li>• Test user registration forms</li>
                <li>• Populate databases with sample data</li>
                <li>• Create mock user profiles</li>
                <li>• Test email functionality</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-2">Privacy & Security:</h4>
              <ul className="space-y-1 text-muted-foreground">
                <li>• Protect personal information</li>
                <li>• Create anonymous accounts</li>
                <li>• Test privacy features</li>
                <li>• Generate placeholder data</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Important Notes</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-xs sm:text-sm text-muted-foreground">
            <p>• These are randomly generated names and do not represent real people</p>
            <p>• Use responsibly and in accordance with applicable laws and regulations</p>
            <p>• Do not use for fraudulent purposes or identity theft</p>
            <p>• Perfect for testing, development, and privacy protection</p>
            <p>• All generated data is fictional and should not be used maliciously</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
