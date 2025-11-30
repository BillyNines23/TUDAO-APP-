// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";

/**
 * @title TUDAO Professional Node Pass
 * @notice ERC721 NFT for Professional tier node licenses
 * @dev Simple contract with minter role for server-side minting
 */
contract ProfessionalNodePass is ERC721, AccessControl {
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");
    
    uint256 private _nextTokenId = 1;
    string private _baseTokenURI;
    
    constructor(
        address admin,
        string memory baseURI
    ) ERC721("TUDAO Professional Node Pass", "TUDAO-PROFESSIONAL") {
        _grantRole(DEFAULT_ADMIN_ROLE, admin);
        _grantRole(MINTER_ROLE, admin);
        _baseTokenURI = baseURI;
    }
    
    /**
     * @notice Mint a new Professional Node Pass NFT
     * @param to Recipient address
     * @return tokenId The ID of the minted token
     */
    function mint(address to) external onlyRole(MINTER_ROLE) returns (uint256) {
        uint256 tokenId = _nextTokenId++;
        _safeMint(to, tokenId);
        return tokenId;
    }
    
    /**
     * @notice Update the base token URI
     * @param baseURI New base URI
     */
    function setBaseURI(string memory baseURI) external onlyRole(DEFAULT_ADMIN_ROLE) {
        _baseTokenURI = baseURI;
    }
    
    /**
     * @notice Get the base token URI
     */
    function _baseURI() internal view override returns (string memory) {
        return _baseTokenURI;
    }
    
    /**
     * @notice Get total supply
     */
    function totalSupply() public view returns (uint256) {
        return _nextTokenId - 1;
    }
    
    /**
     * @dev Required override for AccessControl + ERC721
     */
    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC721, AccessControl)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }
}
