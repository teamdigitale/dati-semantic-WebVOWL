package it.gov.innovazione.owl2vowl.model.entities;

import org.semanticweb.owlapi.model.IRI;

import java.util.Set;

public interface HasEquivalents {

	void addEquivalentElement(IRI iri);

	Set<IRI> getEquivalentElements();

}
