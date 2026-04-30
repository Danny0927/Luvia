import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  createContext,
  type ReactNode,
  type SetStateAction,
  useContext,
  useEffect,
  useState,
} from "react";

const ACCOUNT_STORAGE_KEY = "luvia:accounts:v2";

type AccountRecord = {
  name: string;
  email: string;
  birthDate: string;
  profileImageUri: string;
  password: string;
};

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
  activeAccountKey: string;
  hasAccount: boolean;
  accountExists: boolean;
  hydrated: boolean;
  accountEmailExists: (email: string) => boolean;
  resetAccountDraft: () => void;
  activateAccount: () => boolean;
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
  const [accountsByEmail, setAccountsByEmail] = useState<Record<string, AccountRecord>>({});
  const [activeEmailKey, setActiveEmailKey] = useState("");
  const [loggedIn, setLoggedIn] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  const getEmailKey = (value: string) => value.trim().toLowerCase();

  const getCurrentAccount = (): AccountRecord => ({
    name,
    email,
    birthDate,
    profileImageUri,
    password,
  });

  const loadAccount = (account: AccountRecord) => {
    setName(account.name);
    setEmail(account.email);
    setBirthDate(account.birthDate);
    setProfileImageUri(account.profileImageUri);
    setPassword(account.password);
  };

  const resetAccountDraft = () => {
    setName("");
    setEmail("");
    setBirthDate("");
    setProfileImageUri("");
    setPassword("");
    setActiveEmailKey("");
    setLoggedIn(false);
  };

  const accountEmailExists = (emailInput: string) =>
    !!accountsByEmail[getEmailKey(emailInput)];

  const activateAccount = () => {
    const emailKey = getEmailKey(email);

    if (!emailKey || accountsByEmail[emailKey]) {
      return false;
    }

    setAccountsByEmail((currentAccounts) => ({
      ...currentAccounts,
      [emailKey]: getCurrentAccount(),
    }));
    setActiveEmailKey(emailKey);
    setLoggedIn(true);

    return true;
  };

  const logIn = (emailInput: string, passwordInput: string) => {
    const emailKey = getEmailKey(emailInput);
    const account = accountsByEmail[emailKey];
    const canLogIn = !!account && account.password === passwordInput;

    if (!canLogIn || !account) {
      return false;
    }

    loadAccount(account);
    setActiveEmailKey(emailKey);
    setLoggedIn(true);

    return true;
  };

  const logOut = () => {
    setLoggedIn(false);
    setActiveEmailKey("");
  };

  useEffect(() => {
    const loadAccount = async () => {
      try {
        const storedAccount = await AsyncStorage.getItem(ACCOUNT_STORAGE_KEY);

        if (storedAccount) {
          const parsedAccount = JSON.parse(storedAccount) as Partial<{
            accountsByEmail: Record<string, AccountRecord>;
            accounts: Record<string, AccountRecord>;
            name: string;
            email: string;
            birthDate: string;
            profileImageUri: string;
            password: string;
          }>;

          if (parsedAccount.accountsByEmail) {
            setAccountsByEmail(parsedAccount.accountsByEmail);
          } else if (parsedAccount.accounts) {
            setAccountsByEmail(parsedAccount.accounts);
          } else if (
            typeof parsedAccount.name === "string" &&
            typeof parsedAccount.email === "string" &&
            typeof parsedAccount.password === "string"
          ) {
            const migratedAccount: AccountRecord = {
              name: parsedAccount.name,
              email: parsedAccount.email,
              birthDate:
                typeof parsedAccount.birthDate === "string"
                  ? parsedAccount.birthDate
                  : "",
              profileImageUri:
                typeof parsedAccount.profileImageUri === "string"
                  ? parsedAccount.profileImageUri
                  : "",
              password: parsedAccount.password,
            };

            setAccountsByEmail({
              [getEmailKey(migratedAccount.email)]: migratedAccount,
            });
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
      JSON.stringify({ accountsByEmail })
    ).catch(() => {
      // Keep in-memory account details even if persistence fails.
    });
  }, [accountsByEmail, hydrated]);

  useEffect(() => {
    if (!hydrated || !loggedIn || !activeEmailKey) {
      return;
    }

    setAccountsByEmail((currentAccounts) => ({
      ...currentAccounts,
      [activeEmailKey]: getCurrentAccount(),
    }));
  }, [
    activeEmailKey,
    birthDate,
    email,
    hydrated,
    loggedIn,
    name,
    password,
    profileImageUri,
  ]);

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
        activeAccountKey: activeEmailKey,
        hasAccount: loggedIn,
        accountExists: Object.keys(accountsByEmail).length > 0,
        hydrated,
        accountEmailExists,
        resetAccountDraft,
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
