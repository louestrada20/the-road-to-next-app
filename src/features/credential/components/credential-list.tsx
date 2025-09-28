import {format} from "date-fns";
import { Placeholder } from "@/components/placeholder";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {getCredentials} from "@/features/credential/queries/get-credentials";
import { RevokeCredentialButton } from "./revoke-credential-button";

type CredentialListProps = {   
    organizationId: string;
}    

const CredentialList = async ({organizationId}: CredentialListProps) => {
    const credentials = await getCredentials(organizationId);

    if (!credentials.length) {
        return <Placeholder label="No credentials found" />;
    }



    return (
        <Table>
            <TableHeader>
                <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Created At</TableHead>
                    <TableHead>Last Used</TableHead>
                    <TableHead />
                </TableRow>
            </TableHeader>
            <TableBody>
                {credentials.map((credential: {id: string, name: string, createdAt: Date, lastUsed?: Date | null, revokedAt?: Date | null}) => {      
                    const buttons = credential.revokedAt ? null : <RevokeCredentialButton organizationId={organizationId} credentialId={credential.id} />;
                    return (
                        <TableRow key={credential.id}>
                            <TableCell>{credential.revokedAt ? <p className="line-through">Revoked</p> : credential.name }</TableCell>            
                            <TableCell>{format(credential.createdAt, "yyyy-MM-dd, HH:mm")}</TableCell>
                            <TableCell>{credential.lastUsed ? format(credential.lastUsed, "yyyy-MM-dd, HH:mm") : "Never"}</TableCell>
                            <TableCell className="flex justify-end gap-x-2">{buttons}</TableCell>
                        </TableRow>
                    );
                })}
            </TableBody>
        </Table>
    );
};

export default CredentialList;