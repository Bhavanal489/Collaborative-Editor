import dotenv from "dotenv";

dotenv.config({
  path: ".env.local",
});

import { Server } from "@hocuspocus/server";
import { createClient } from "@supabase/supabase-js";
import * as Y from "yjs";

const supabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL;

const supabasePublishableKey =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

const supabaseSecretKey =
  process.env.SUPABASE_SECRET_KEY;

if (
  !supabaseUrl ||
  !supabasePublishableKey ||
  !supabaseSecretKey
) {
  throw new Error(
    "Supabase environment variables are missing."
  );
}

function createSupabaseClient(token: string) {
  return createClient(
    supabaseUrl,
    supabasePublishableKey,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
      global: {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    }
  );
}

const supabaseAdmin = createClient(
  supabaseUrl,
  supabaseSecretKey,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);

async function getDocumentId(
  documentName: string
) {
  const { data, error } =
    await supabaseAdmin
      .from("documents")
      .select("id")
      .eq("room_name", documentName)
      .single();

  if (error || !data) {
    throw new Error(
      `Document "${documentName}" was not found.`
    );
  }

  return data.id;
}

type UserRole =
  | "owner"
  | "editor"
  | "viewer";

type UserContext = {
  user: {
    id: string;
    name: string;
    role: UserRole;
  };
};

type ConnectionConfig = {
  readOnly: boolean;
  isAuthenticated: boolean;
};

const server = new Server<UserContext>({
  port: 1234,

  async onAuthenticate(data) {
    const {
      token,
      documentName,
    } = data;

    if (!token) {
      throw new Error(
        "Authentication required."
      );
    }

    const supabase =
      createSupabaseClient(token);

    const {
      data: { user },
      error: userError,
    } =
      await supabase.auth.getUser(token);

    if (userError || !user) {
      throw new Error(
        "Invalid authentication token."
      );
    }

    const {
      data: document,
      error: documentError,
    } =
      await supabase
        .from("documents")
        .select("id, owner_id")
        .eq("room_name", documentName)
        .single();

    if (
      documentError ||
      !document
    ) {
      throw new Error(
        "Document not found or access denied."
      );
    }

    const userName =
      user.user_metadata?.full_name ||
      user.email ||
      "User";

    let role: UserRole;

    if (
      document.owner_id === user.id
    ) {
      role = "owner";
    } else {
      const {
        data: membership,
        error: membershipError,
      } =
        await supabase
          .from("document_members")
          .select("role")
          .eq(
            "document_id",
            document.id
          )
          .eq(
            "user_id",
            user.id
          )
          .single();

      if (
        membershipError ||
        !membership
      ) {
        throw new Error(
          "You do not have access to this document."
        );
      }

      role =
        membership.role as
          | "editor"
          | "viewer";
    }

    const connectionConfig =
      (data as typeof data & {
        connectionConfig?: ConnectionConfig;
      }).connectionConfig;

    if (!connectionConfig) {
      throw new Error(
        "Hocuspocus connection configuration is unavailable."
      );
    }

    if (role === "viewer") {
      connectionConfig.readOnly = true;

      console.log(
        `Authenticated VIEWER "${userName}" for "${documentName}" - READ ONLY`
      );
    } else {
      connectionConfig.readOnly = false;

      console.log(
        `Authenticated ${role.toUpperCase()} "${userName}" for "${documentName}" - WRITE ACCESS`
      );
    }

    return {
      user: {
        id: user.id,
        name: userName,
        role,
      },
    };
  },

  async onLoadDocument({
    documentName,
  }) {
    try {
      const documentId =
        await getDocumentId(
          documentName
        );

      const {
        data,
        error,
      } =
        await supabaseAdmin
          .from("document_contents")
          .select("content")
          .eq(
            "document_id",
            documentId
          )
          .maybeSingle();

      if (error) {
        throw error;
      }

      if (!data?.content) {
        console.log(
          `No saved content for "${documentName}", starting new document.`
        );

        return new Y.Doc();
      }

      const update =
        new Uint8Array(
          Buffer.from(
            data.content,
            "base64"
          )
        );

      const document =
        new Y.Doc();

      Y.applyUpdate(
        document,
        update
      );

      console.log(
        `Loaded saved document "${documentName}"`
      );

      return document;
    } catch (error) {
      console.error(
        `Failed to load "${documentName}":`,
        error
      );

      throw error;
    }
  },

  async onStoreDocument({
    document,
    documentName,
  }) {
    try {
      const documentId =
        await getDocumentId(
          documentName
        );

      const update =
        Y.encodeStateAsUpdate(
          document
        );

      const content =
        Buffer.from(
          update
        ).toString("base64");

      const now =
        new Date().toISOString();

      const {
        error,
      } =
        await supabaseAdmin
          .from("document_contents")
          .upsert(
            {
              document_id:
                documentId,
              content,
              updated_at: now,
            },
            {
              onConflict:
                "document_id",
            }
          );

      if (error) {
        throw error;
      }

      const {
        error: timestampError,
      } =
        await supabaseAdmin
          .from("documents")
          .update({
            updated_at: now,
          })
          .eq(
            "id",
            documentId
          );

      if (timestampError) {
        throw timestampError;
      }

      console.log(
        `Saved document "${documentName}" to Supabase`
      );
    } catch (error) {
      console.error(
        `Failed to save "${documentName}":`,
        error
      );

      throw error;
    }
  },
});

server.listen();

console.log(
  "Hocuspocus server running on ws://127.0.0.1:1234"
);