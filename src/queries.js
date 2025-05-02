import {gql} from "@apollo/client"
export const DELETE_USER = gql`
    mutation DeleteUser($id:ID!){
        deleteUser(id:$id)
    }
`
export const UPDATE_USER = gql`
    mutation UpdateUser($id:ID!,$name:String!,$email:String!){
        updateUser(id : $id,name:$name,email:$email){
            id
            name
            email
        }
    }
`
export const GET_USERS = gql`
    query{
        getUsers {
            id
            nom
            prenom
        }
    }
`
export const AJOUT_USERS = gql`
    mutation  creerUtilisateur($nom:String! , $prenom : String!){
        creerUtilisateur(nom:$nom , prenom: $prenom){
            id
            nom 
            prenom
        }
    }
`;
export const SUPPRIMER = gql`
    mutation supprimerUsers($id:ID!){
        supprimerUsers(id:$id)
}
`
export const MODIFIER_USER = gql`
    mutation ModifierUser($id : ID!, $nom : String!, $prenom : String!,$age : Int!){
        modifierUser(id : $id, nom : $nom, prenom : $prenom, age : Int!){
            id
            nom
            prenom
            age
        }
    }
`
