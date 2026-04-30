import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  createContext,
  type ReactNode,
  type SetStateAction,
  useContext,
  useEffect,
  useState,
} from "react";

const ACCOUNT_STORAGE_KEY = "luvia:account";

type AccountContextValue = {
  name: string;
  setName: (value: SetStateAction<string>) => void;
  email: string;
  setEmail: (value: SetStateAction<string>) => void;
  birthDate: string;
  setBirthDate: (value: SetStateAction<string>) => void;
  profileImageUri: string;
  setProfileImageUri: (value: SetStateAction<string>) => void;
  password: string;
  setPassword: (value: SetStateAction<string>) => void;
  hasAccount: boolean;
  accountExists: boolean;
  hydrated: boolean;
  activateAccount: () => void;
  logIn: (email: string, password: string) => boolean;
  logOut: () => void;
};

const AccountContext = createContext<AccountContextValue | null>(null);

export function AccountProvider({ children }: { children: ReactNode }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [profileImageUri, setProfileImageUri] = useState("");
  const [password, setPassword] = useState("");
  const [loggedIn, setLoggedIn] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  const activateAccount = () => {
    setLoggedIn(true);
  };

  const logIn = (emailInput: string, passwordInput: string) => {
    const emailMatches =
      email.trim().toLowerCase() === emailInput.trim().toLowerCase();
    const passwordMatches = password === passwordInput;
    const canLogIn = emailMatches && passwordMatches;

    if (canLogIn) {
      setLoggedIn(true);
    }

    return canLogIn;
  };

  const logOut = () => {
    setLoggedIn(false);
  };

  useEffect(() => {
    const loadAccount = async () => {
      try {
        const storedAccount = await AsyncStorage.getItem(ACCOUNT_STORAGE_KEY);

        if (storedAccount) {
          const parsedAccount = JSON.parse(storedAccount) as Partial<{
            name: string;
            email: string;
            birthDate: string;
            profileImageUri: string;
            password: string;
          }>;

          if (typeof parsedAccount.name === "string") {
            setName(parsedAccount.name);
          }

          if (typeof parsedAccount.email === "string") {
            setEmail(parsedAccount.email);
          }

          if (typeof parsedAccount.birthDate === "string") {
            setBirthDate(parsedAccount.birthDate);
          }

          if (typeof parsedAccount.profileImageUri === "string") {
            setProfileImageUri(parsedAccount.profileImageUri);
          }

          if (typeof parsedAccount.password === "string") {
            setPassword(parsedAccount.password);
          }
        }
      } catch {
        // Keep the default empty account if local storage is unavailable.
      } finally {
        setHydrated(true);
      }
    };

    void loadAccount();
  }, []);

  useEffect(() => {
    if (!hydrated) {
      return;
    }

    void AsyncStorage.setItem(
      ACCOUNT_STORAGE_KEY,
      JSON.stringify({ name, email, birthDate, profileImageUri, password })
    ).catch(() => {
      // Keep in-memory account details even if persistence fails.
    });
  }, [birthDate, email, hydrated, name, password, profileImageUri]);

  return (
    <AccountContext.Provider
      value={{
        name,
        setName,
        email,
        setEmail,
        birthDate,
        setBirthDate,
        profileImageUri,
        setProfileImageUri,
        password,
        setPassword,
        hasAccount: loggedIn,
        accountExists:
          name.trim().length > 0 &&
          email.trim().length > 0 &&
          password.length > 0,
        hydrated,
        activateAccount,
        logIn,
        logOut,
      }}
    >
      {children}
    </AccountContext.Provider>
  );
}

export function useAccount() {
  const context = useContext(AccountContext);

  if (!context) {
    throw new Error("useAccount must be used within AccountProvider");
  }

  return context;
}
