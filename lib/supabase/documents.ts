import { createClient } from "./client";

export type DocumentInfo = {
  id: string;
  name: string;
  room_name: string;
  owner_id: string;
  created_at: string;
  updated_at: string;
};

export type DocumentMember = {
  id: string;
  document_id: string;
  user_id: string;
  role: "editor" | "viewer";
  created_at: string;
  profile?: {
    email: string;
    full_name: string | null;
  };
};

export type SharedDocumentInfo = DocumentInfo & {
  role: "editor" | "viewer";
};

export type DocumentRole =
  | "owner"
  | "editor"
  | "viewer";

export async function getDocuments() {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("User not logged in");
  }

  const {
    data,
    error,
  } = await supabase
    .from("documents")
    .select("*")
    .eq("owner_id", user.id)
    .order("updated_at", {
      ascending: false,
    });

  if (error) {
    throw error;
  }

  return data as DocumentInfo[];
}

export async function getSharedDocuments() {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("User not logged in");
  }

  const {
    data: memberships,
    error: membershipError,
  } = await supabase
    .from("document_members")
    .select("document_id, role")
    .eq("user_id", user.id);

  if (membershipError) {
    throw membershipError;
  }

  if (!memberships || memberships.length === 0) {
    return [];
  }

  const documentIds = memberships.map(
    (membership) => membership.document_id
  );

  const {
    data: documents,
    error: documentsError,
  } = await supabase
    .from("documents")
    .select("*")
    .in("id", documentIds)
    .neq("owner_id", user.id)
    .order("updated_at", {
      ascending: false,
    });

  if (documentsError) {
    throw documentsError;
  }

  return (documents || []).map((document) => {
    const membership = memberships.find(
      (item) =>
        item.document_id === document.id
    );

    return {
      ...document,
      role: membership?.role || "viewer",
    };
  }) as SharedDocumentInfo[];
}

export async function getDocumentRole(
  documentId: string
): Promise<DocumentRole> {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("User not logged in");
  }

  const {
    data: document,
    error: documentError,
  } = await supabase
    .from("documents")
    .select("owner_id")
    .eq("id", documentId)
    .single();

  if (documentError) {
    throw documentError;
  }

  if (document.owner_id === user.id) {
    return "owner";
  }

  const {
    data: membership,
    error: membershipError,
  } = await supabase
    .from("document_members")
    .select("role")
    .eq("document_id", documentId)
    .eq("user_id", user.id)
    .single();

  if (membershipError || !membership) {
    throw new Error(
      "You do not have access to this document."
    );
  }

  return membership.role as
    | "editor"
    | "viewer";
}

export async function createDocument(
  name: string
) {
  const supabase = createClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError) {
    throw new Error(
      `Authentication error: ${userError.message}`
    );
  }

  if (!user) {
    throw new Error(
      "User is not logged in."
    );
  }

  const roomName = name.trim();

  if (!roomName) {
    throw new Error(
      "Document name cannot be empty."
    );
  }

  console.log(
    "Creating document for user:",
    user.id
  );

  console.log(
    "Document name:",
    roomName
  );

  const {
    error: insertError,
  } = await supabase
    .from("documents")
    .insert({
      owner_id: user.id,
      name: roomName,
      room_name: roomName,
    });

  if (insertError) {
    console.error(
      "========== DOCUMENT INSERT ERROR =========="
    );

    console.error(
      "Code:",
      insertError.code
    );

    console.error(
      "Message:",
      insertError.message
    );

    console.error(
      "Details:",
      insertError.details
    );

    console.error(
      "Hint:",
      insertError.hint
    );

    console.error(
      "==========================================="
    );

    if (insertError.code === "23505") {
      throw new Error(
        "A document with this room name already exists. Please choose another name."
      );
    }

    if (insertError.code === "42501") {
      throw new Error(
        "You do not have permission to create documents."
      );
    }

    throw new Error(
      `Create document failed: ${insertError.message}`
    );
  }

  console.log(
    "Document inserted successfully."
  );

  const {
    data: createdDocument,
    error: fetchError,
  } = await supabase
    .from("documents")
    .select("*")
    .eq("room_name", roomName)
    .eq("owner_id", user.id)
    .single();

  if (fetchError) {
    console.error(
      "========== DOCUMENT FETCH ERROR =========="
    );

    console.error(
      "Code:",
      fetchError.code
    );

    console.error(
      "Message:",
      fetchError.message
    );

    console.error(
      "Details:",
      fetchError.details
    );

    console.error(
      "Hint:",
      fetchError.hint
    );

    console.error(
      "=========================================="
    );

    throw new Error(
      `Document was created, but could not be loaded: ${fetchError.message}`
    );
  }

  console.log(
    "Document created successfully:",
    createdDocument
  );

  return createdDocument as DocumentInfo;
}

export async function renameDocument(
  id: string,
  newName: string
) {
  const supabase = createClient();

  const trimmedName = newName.trim();

  if (!trimmedName) {
    throw new Error(
      "Document name cannot be empty."
    );
  }

  const {
    data,
    error,
  } = await supabase
    .from("documents")
    .update({
      name: trimmedName,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data as DocumentInfo;
}

export async function deleteDocument(
  id: string
) {
  const supabase = createClient();

  const { error } = await supabase
    .from("documents")
    .delete()
    .eq("id", id);

  if (error) {
    throw error;
  }
}

export async function getDocumentByRoom(
  roomName: string
) {
  const supabase = createClient();

  const {
    data,
    error,
  } = await supabase
    .from("documents")
    .select("*")
    .eq("room_name", roomName)
    .single();

  if (error) {
    throw error;
  }

  return data as DocumentInfo;
}

export async function getDocumentMembers(
  documentId: string
) {
  const supabase = createClient();

  const {
    data: members,
    error: membersError,
  } = await supabase
    .from("document_members")
    .select(
      "id, document_id, user_id, role, created_at"
    )
    .eq("document_id", documentId);

  if (membersError) {
    throw membersError;
  }

  if (!members || members.length === 0) {
    return [];
  }

  const userIds = members.map(
    (member) => member.user_id
  );

  const {
    data: profiles,
    error: profilesError,
  } = await supabase
    .from("profiles")
    .select("id, email, full_name")
    .in("id", userIds);

  if (profilesError) {
    throw profilesError;
  }

  return members.map((member) => ({
    ...member,
    profile: profiles?.find(
      (profile) =>
        profile.id === member.user_id
    ),
  })) as DocumentMember[];
}

export async function addDocumentMember(
  documentId: string,
  email: string,
  role: "editor" | "viewer"
) {
  const supabase = createClient();

  const {
    data: profile,
    error: profileError,
  } = await supabase
    .from("profiles")
    .select("id, email, full_name")
    .eq(
      "email",
      email.trim().toLowerCase()
    )
    .single();

  if (profileError || !profile) {
    throw new Error(
      "No registered user was found with this email."
    );
  }

  const {
    data,
    error,
  } = await supabase
    .from("document_members")
    .insert({
      document_id: documentId,
      user_id: profile.id,
      role,
    })
    .select()
    .single();

  if (error) {
    if (error.code === "23505") {
      throw new Error(
        "This user already has access to the document."
      );
    }

    throw error;
  }

  return data;
}

export async function updateDocumentMemberRole(
  memberId: string,
  role: "editor" | "viewer"
) {
  const supabase = createClient();

  const { error } = await supabase
    .from("document_members")
    .update({ role })
    .eq("id", memberId);

  if (error) {
    throw error;
  }
}

export async function removeDocumentMember(
  memberId: string
) {
  const supabase = createClient();

  const { error } = await supabase
    .from("document_members")
    .delete()
    .eq("id", memberId);

  if (error) {
    throw error;
  }
}